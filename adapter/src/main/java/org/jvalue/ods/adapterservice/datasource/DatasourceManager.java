package org.jvalue.ods.adapterservice.datasource;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.model.AdapterConfig;
import org.jvalue.ods.adapterservice.adapter.model.DataImportResponse;
import org.jvalue.ods.adapterservice.adapter.model.exceptions.*;
import org.jvalue.ods.adapterservice.datasource.api.amqp.AmqpPublisher;
import org.jvalue.ods.adapterservice.datasource.model.*;
import org.jvalue.ods.adapterservice.datasource.model.exceptions.*;
import org.jvalue.ods.adapterservice.datasource.repository.DataImportRepository;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.everit.json.schema.ValidationException;

import org.jvalue.ods.adapterservice.datasource.validator.*;

import java.io.IOException;
import java.util.Collection;
import java.util.Date;
import java.util.stream.StreamSupport;

@Slf4j
@Service
@AllArgsConstructor
public class DatasourceManager {
  private final DatasourceRepository datasourceRepository;
  private final DataImportRepository dataImportRepository;
  private final Adapter adapter;
  private final AmqpPublisher amqpPublisher;

  @Transactional
  public Datasource createDatasource(Datasource config) {
    if (config.getId() != null) {
      throw new IllegalArgumentException("Id is defined by the server. Id field must not be set.");
    }
    config.getMetadata().setCreationTimestamp(new Date()); // creation time documented by server

    Datasource savedConfig = datasourceRepository.save(config);

    amqpPublisher.publishCreation(savedConfig);
    return savedConfig;
  }

  public Datasource getDatasource(Long id) throws DatasourceNotFoundException {
    return datasourceRepository.findById(id).orElseThrow(() -> new DatasourceNotFoundException(id));
  }

  public Iterable<Datasource> getAllDatasources() {
    return datasourceRepository.findAll();
  }

  @Transactional
  public void updateDatasource(Long id, Datasource update) throws DatasourceNotFoundException {
    Datasource existing = datasourceRepository.findById(id).orElseThrow(() -> new DatasourceNotFoundException(id));

    datasourceRepository.save(applyUpdate(existing, update));
    amqpPublisher.publishUpdate(existing);
  }

  @Transactional
  public void deleteDatasource(Long id) throws DatasourceNotFoundException {
    Datasource datasource = datasourceRepository.findById(id).orElseThrow(() -> new DatasourceNotFoundException(id));
    datasourceRepository.deleteById(id);
    amqpPublisher.publishDeletion(datasource);
  }

  @Transactional
  public void deleteAllDatasources() {
    Iterable<Datasource> allDatasourceConfigs = getAllDatasources();
    datasourceRepository.deleteAll();
    StreamSupport.stream(allDatasourceConfigs.spliterator(), true).forEach(amqpPublisher::publishDeletion);
  }

  public DataImport.MetaData trigger(Long id, RuntimeParameters runtimeParameters) throws DatasourceNotFoundException, AdapterException, IOException {
    try {
      return executeImport(id, runtimeParameters);
    } catch (Exception e) {
      log.error("Failed to execute import", e);
      publishImportFailure(id, e);
      throw e;
    }
  }

  /**
   * Performs the actual import inside a database transaction. This ensures that,
   * the imported data and the event are always inserted together into the
   * database. <br>
   * Note: This method is an internal API, do not use it from the outside. It is
   * package-private only because {@link Transactional} requires the method to be
   * overridable.
   *
   * @param id                the id of the datasource to import
   * @param runtimeParameters the runtime parameters to use for the import
   * @return the metadata of the imported data
   * @throws IOException
   * @throws InterpreterParameterException
   * @throws ImporterParameterException
   */
  @Transactional
  DataImport.MetaData executeImport(Long id, RuntimeParameters runtimeParameters)
      throws DatasourceNotFoundException, ImporterParameterException, InterpreterParameterException, IOException {    
    Datasource datasource = getDatasource(id);
    DataImport dataImport = new DataImport(datasource, "", ValidationMetaData.HealthStatus.FAILED);
    Validator validator = new JsonSchemaValidator();
    try {
      AdapterConfig adapterConfig = datasource.toAdapterConfig(runtimeParameters);
      DataImportResponse executionResult = adapter.executeJob(adapterConfig);
      String responseData = executionResult.getData();
      dataImport = new DataImport(datasource, responseData);
      dataImport.setValidationMetaData(validator.validate(dataImport));

      DataImport savedDataImport = dataImportRepository.save(dataImport);
      amqpPublisher.publishImportSuccess(id, savedDataImport.getData());

      return savedDataImport.getMetaData();
    } catch (ImporterParameterException | InterpreterParameterException | IOException e) {
      handleImportFailed(datasource, dataImport, e);
      throw e;
    }   
  }

  @Transactional
  void handleImportFailed(Datasource datasource, DataImport dataImport, Exception e){
      DataImport savedDataImport = dataImportRepository.save(dataImport);
      publishImportFailure(datasource.getId(), e);   
  }

  private void publishImportFailure(Long id, Exception e) {
    String errMsg;
    if (e.getCause() != null) {
      errMsg = e.getCause().getMessage();
    } else {
      errMsg = e.getMessage();
    }
    amqpPublisher.publishImportFailure(id, errMsg);
  }

  /**
   * Create an updated DatasourceConfig using the full representation of an update. This method ensures that id and
   * creation time remain stable.
   *
   * @param updateConfig the representation of the updated config
   * @return an updated DatasourceConfig that has the same id and creationTimestamp as the original one.
   */
  private Datasource applyUpdate(Datasource existing, Datasource updateConfig) {
    DatasourceMetadata updatedMetadata = new DatasourceMetadata(
      updateConfig.getMetadata().getAuthor(),
      updateConfig.getMetadata().getLicense(),
      updateConfig.getMetadata().getDisplayName(),
      updateConfig.getMetadata().getDescription());
    updatedMetadata.setCreationTimestamp(existing.getMetadata().getCreationTimestamp());

    Datasource updated = new Datasource(
      updateConfig.getProtocol(),
      updateConfig.getFormat(),
      updatedMetadata,
      updateConfig.getTrigger(),
      updateConfig.getSchema());
    updated.setId(existing.getId());

    return updated;
  }

  public Collection<DataImport> getDataImportsForDatasource(Long datasourceId) throws DatasourceNotFoundException {
    Datasource datasource = getDatasource(datasourceId);
    return datasource.getDataImports();
  }

  public DataImport getLatestDataImportForDatasource(Long datasourceId) throws DatasourceNotFoundException, DataImportLatestNotFoundException {
    getDatasource(datasourceId);
    DataImport dataImport = dataImportRepository
      .findTopByDatasourceIdOrderByTimestampDesc(datasourceId)
      .orElseThrow(() -> new DataImportLatestNotFoundException(datasourceId));
    return dataImport;
  }

  public DataImport getDataImportForDatasource(Long datasourceId, Long dataImportId) throws DatasourceNotFoundException, DataImportNotFoundException {
    getDatasource(datasourceId);
    DataImport dataImport = dataImportRepository
      .findByDatasourceIdAndId(datasourceId, dataImportId)
      .orElseThrow(() -> new DataImportNotFoundException(datasourceId, dataImportId));
    return dataImport;
  }

}
