package org.jvalue.ods.adapterservice.datasource;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.jvalue.ods.adapterservice.adapter.Adapter;
import org.jvalue.ods.adapterservice.adapter.Format;
import org.jvalue.ods.adapterservice.adapter.Protocol;
import org.jvalue.ods.adapterservice.adapter.model.DataImportResponse;
import org.jvalue.ods.adapterservice.datasource.api.amqp.AmqpPublisher;
import org.jvalue.ods.adapterservice.datasource.model.DataImport;
import org.jvalue.ods.adapterservice.datasource.model.Datasource;
import org.jvalue.ods.adapterservice.datasource.model.RuntimeParameters;
import org.jvalue.ods.adapterservice.datasource.model.exceptions.DataImportLatestNotFoundException;
import org.jvalue.ods.adapterservice.datasource.model.exceptions.DataImportNotFoundException;
import org.jvalue.ods.adapterservice.datasource.model.exceptions.DatasourceNotFoundException;
import org.jvalue.ods.adapterservice.datasource.repository.DataImportRepository;
import org.jvalue.ods.adapterservice.datasource.repository.DatasourceRepository;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;

import java.io.File;
import java.io.IOException;
import java.text.ParseException;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.jvalue.ods.adapterservice.adapter.Format.JSON;
import static org.jvalue.ods.adapterservice.adapter.Protocol.HTTP;
import static org.jvalue.ods.adapterservice.datasource.TestHelper.generateDatasource;
import static org.jvalue.ods.adapterservice.datasource.TestHelper.generateParameterizableDatasource;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DatasourceManagerTest {

  private final ObjectMapper mapper = new ObjectMapper();
  private final File configFile = new File(
      "src/test/java/org/jvalue/ods/adapterservice/datasource/config/DatasourceConfig.json");

  @Mock
  DatasourceRepository datasourceRepository;

  @Mock
  DataImportRepository dataImportRepository;

  @Mock
  AmqpPublisher amqpPublisher;

  @Mock
  Adapter adapter;

  @InjectMocks
  private DatasourceManager manager;

  @Test
  public void testCreateDatasource() throws IOException {
    Datasource config = mapper.readValue(configFile, Datasource.class);
    config.setId(null);

    Datasource expectedConfig = new Datasource(config.getProtocol(), config.getFormat(), config.getMetadata(),
        config.getTrigger(), config.getSchema());
    expectedConfig.setId(123L);

    when(datasourceRepository.save(config)).thenReturn(expectedConfig);

    Datasource result = manager.createDatasource(config);

    assertEquals(expectedConfig, result);
    verify(datasourceRepository).save(config);
    verify(amqpPublisher).publishCreation(result);
  }

  @Test
  public void testGetDatasource() throws IOException, DatasourceNotFoundException {
    Datasource config = mapper.readValue(configFile, Datasource.class);

    Datasource expectedConfig = new Datasource(config.getProtocol(), config.getFormat(), config.getMetadata(),
        config.getTrigger(), config.getSchema());
    expectedConfig.setId(123L);

    when(datasourceRepository.findById(123L)).thenReturn(Optional.of(config));

    Datasource result = manager.getDatasource(123L);

    assertEquals(config, result);
  }

  @Test
  public void testGetNonExistingDatasource() {
    when(datasourceRepository.findById(123L)).thenReturn(Optional.empty());

    assertThrows(DatasourceNotFoundException.class, () -> manager.getDatasource(123L));
  }

  @Test
  public void testUpdateDatasource() throws IOException, DatasourceNotFoundException {
    Datasource config = mapper.readValue(configFile, Datasource.class);
    config.setId(123L);

    Datasource updated = new Datasource(config.getProtocol(), config.getFormat(), config.getMetadata(),
        config.getTrigger(), config.getSchema());
    updated.setId(123L);

    when(datasourceRepository.findById(123L)).thenReturn(Optional.of(config));

    manager.updateDatasource(123L, updated);

    verify(datasourceRepository).save(updated);
    verify(amqpPublisher).publishUpdate(updated);
  }

  @Test
  public void testUpdateNonExistingDatasource() throws IOException {
    Datasource config = mapper.readValue(configFile, Datasource.class);
    config.setId(123L);

    when(datasourceRepository.findById(123L)).thenReturn(Optional.empty());
    assertThrows(DatasourceNotFoundException.class, () -> manager.updateDatasource(123L, config));
  }

  @Test
  public void testDeleteDatasource() throws IOException, DatasourceNotFoundException {
    Datasource config = mapper.readValue(configFile, Datasource.class);
    when(datasourceRepository.findById(123L)).thenReturn(Optional.of(config));
    manager.deleteDatasource(123L);

    verify(datasourceRepository).deleteById(123L);
    verify(amqpPublisher).publishDeletion(config);
  }

  @Test
  public void testDeleteNonExistingDatasource() {
    when(datasourceRepository.findById(123L)).thenReturn(Optional.empty());
    assertThrows(DatasourceNotFoundException.class, () -> manager.deleteDatasource(123L));
  }

  @Test
  public void testDeleteAllDatasources() throws IOException {
    Datasource config = mapper.readValue(configFile, Datasource.class);

    when(datasourceRepository.findAll()).thenReturn(List.of(config, config, config) // add the same config three times
                                                                                    // with different id's
    );

    manager.deleteAllDatasources();

    verify(datasourceRepository).deleteAll();
    verify(amqpPublisher, times(3)).publishDeletion(config);
  }

  @Test
  public void testTriggerForNotExistingDatasource() {
    when(datasourceRepository.findById(anyLong())).thenReturn(Optional.empty());

    assertThrows(DatasourceNotFoundException.class, () -> manager.trigger(1L, null));
  }

  @Test
  public void testTriggerWithoutRuntimeParameters() throws Exception {
    Datasource datasource = generateDatasource(Protocol.HTTP, Format.JSON, "location");
    when(datasourceRepository.findById(1L)).thenReturn(Optional.of(datasource));
    when(dataImportRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    when(adapter.executeJob(datasource.toAdapterConfig(null)))
        .thenReturn(new DataImportResponse("{\"hallo\":\"hello\"}"));

    DataImport.MetaData result = manager.trigger(1L, null);

    verify(amqpPublisher).publishImportSuccess(1L, "{\"hallo\":\"hello\"}");
    assertEquals("/datasources/null/imports/null/data", result.getLocation());
    assertNull(result.getId());
    verify(dataImportRepository).save(any(DataImport.class));
  }

  @Test
  public void testTriggerWithRuntimeParameters() throws Exception {
    Datasource datasource = generateParameterizableDatasource(HTTP, JSON, "http://www.test-url.com/{userId}/{dataId}",
        Map.of("userId", "1", "dataId", "123"));

    when(datasourceRepository.findById(2L)).thenReturn(Optional.of(datasource));

    RuntimeParameters runtimeParameters = new RuntimeParameters(Map.of("userId", "42"));

    when(adapter.executeJob(datasource.toAdapterConfig(runtimeParameters)))
        .thenReturn(new DataImportResponse("{\"hallo\":\"hello\"}"));
    when(dataImportRepository.save(any())).thenAnswer(i -> i.getArgument(0));

    DataImport.MetaData result = manager.trigger(2L, runtimeParameters);

    verify(amqpPublisher).publishImportSuccess(2L, "{\"hallo\":\"hello\"}");
    assertEquals("/datasources/null/imports/null/data", result.getLocation());
    assertNull(result.getId());
    verify(dataImportRepository).save(any(DataImport.class));
  }

  @Test
  public void testTriggerPublishesFailingImport() throws Exception {
    Datasource datasource = generateDatasource(Protocol.HTTP, Format.JSON, "location");

    when(datasourceRepository.findById(3L)).thenReturn(Optional.of(datasource));

    when(adapter.executeJob(datasource.toAdapterConfig(null)))
        .thenThrow(new RestClientException("Do not upset the elders of the internet!"));

    assertThrows(RestClientException.class, () -> manager.trigger(3L, null));

    verify(amqpPublisher).publishImportFailure(3L, "Do not upset the elders of the internet!");
  }

  @Test
  public void testGetDataImports() throws ParseException, DatasourceNotFoundException {
    Datasource datasource = generateDatasource(Protocol.HTTP, Format.JSON, "location");
    DataImport dataimport1 = new DataImport(datasource, "{}");
    DataImport dataimport2 = new DataImport(datasource, "");
    datasource.setDataImports(Set.of(dataimport1, dataimport2));
    when(datasourceRepository.findById(123L)).thenReturn(Optional.of(datasource));

    Collection<DataImport> result = manager.getDataImportsForDatasource(123L);
    assertEquals(2, result.size());
  }

  @Test
  public void testGetDataImportsNonExistingDatasource() {
    when(datasourceRepository.findById(123L)).thenReturn(Optional.empty());
    assertThrows(DatasourceNotFoundException.class, () -> manager.getDataImportsForDatasource(123L));
  }

  @Test
  public void testGetDataImport() throws ParseException, DatasourceNotFoundException, DataImportNotFoundException {
    Datasource datasource = generateDatasource(Protocol.HTTP, Format.JSON, "location");
    when(datasourceRepository.findById(123L)).thenReturn(Optional.of(datasource));

    DataImport dataimport = new DataImport(datasource, "{}");
    when(dataImportRepository.findByDatasourceIdAndId(123L, 234L)).thenReturn(Optional.of(dataimport));

    DataImport result = manager.getDataImportForDatasource(123L, 234L);

    assertEquals(result, dataimport);
  }

  @Test
  public void testGetDataImportNonExistingDatasource() {
    when(datasourceRepository.findById(123L)).thenReturn(Optional.empty());

    assertThrows(DatasourceNotFoundException.class, () -> manager.getDataImportForDatasource(123L, 234L));
  }

  @Test
  public void testGetDataImportNonExistingDataImport() throws ParseException {
    Datasource datasource = generateDatasource(Protocol.HTTP, Format.JSON, "location");
    when(datasourceRepository.findById(123L)).thenReturn(Optional.of(datasource));

    when(dataImportRepository.findByDatasourceIdAndId(123L, 234L)).thenReturn(Optional.empty());

    assertThrows(DataImportNotFoundException.class, () -> manager.getDataImportForDatasource(123L, 234L));
  }

  @Test
  public void testGetLatestDataImportForDatasource()
      throws ParseException, DatasourceNotFoundException, DataImportLatestNotFoundException {
    Datasource datasource = generateDatasource(Protocol.HTTP, Format.JSON, "location");
    when(datasourceRepository.findById(123L)).thenReturn(Optional.of(datasource));

    DataImport dataimport = new DataImport(datasource, "{}");
    when(dataImportRepository.findTopByDatasourceIdOrderByTimestampDesc(123L)).thenReturn(Optional.of(dataimport));

    DataImport result = manager.getLatestDataImportForDatasource(123L);
    assertEquals(result, dataimport);
  }

  @Test
  public void testGetLatestDataImportNonExistingDatasource()
      throws ParseException, DatasourceNotFoundException, DataImportLatestNotFoundException {
    when(datasourceRepository.findById(123L)).thenReturn(Optional.empty());
    assertThrows(DatasourceNotFoundException.class, () -> manager.getLatestDataImportForDatasource(123L));
  }

  @Test
  public void testGetLatestDataImportForDatasourceNoDataImport()
      throws ParseException, DatasourceNotFoundException, DataImportLatestNotFoundException {
    Datasource datasource = generateDatasource(Protocol.HTTP, Format.JSON, "location");
    when(datasourceRepository.findById(123L)).thenReturn(Optional.of(datasource));

    when(dataImportRepository.findTopByDatasourceIdOrderByTimestampDesc(123L)).thenReturn(Optional.empty());
    assertThrows(DataImportLatestNotFoundException.class, () -> manager.getLatestDataImportForDatasource(123L));
  }
}
