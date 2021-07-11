package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import org.jvalue.ods.adapterservice.datasource.api.rest.v1.Mappings;
import org.jvalue.ods.adapterservice.datasource.validator.ValidationMetaData;

import javax.persistence.*;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;

@Entity
@NoArgsConstructor
@EqualsAndHashCode
@Getter
public class DataImport {

  @Id
  @GeneratedValue
  private Long id;

  private byte[] data;
  
  private Date timestamp;

  @Enumerated(EnumType.STRING)
  private ValidationMetaData.HealthStatus health;

  @Column(columnDefinition="TEXT")
  private String errorMessages;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name="datasource_id")
  @JsonIgnore
  private Datasource datasource;

  public DataImport(Datasource datasource, String data) {
    this(datasource, data, ValidationMetaData.HealthStatus.OK, "");
  }

  public DataImport(Datasource datasource, String data, ValidationMetaData.HealthStatus health) {
    this(datasource, data, health, "");
  }

  public DataImport(Datasource datasource, String data, ValidationMetaData.HealthStatus health, String errorMessages) {
    this.datasource = datasource;
    this.data = data.getBytes(StandardCharsets.UTF_8);
    this.health = health;
    this.errorMessages = errorMessages;
    this.timestamp = new Date();
  }

  public void setValidationMetaData(ValidationMetaData validationData) {
    this.health = validationData.getHealthStatus();
    this.errorMessages = validationData.getErrorMessages();
  }

  public String getData() {
    return new String(data, StandardCharsets.UTF_8);
  }

  @JsonIgnore
  public MetaData getMetaData() {
    return new MetaData(this.id, this.timestamp, this.health, this.errorMessages, this.datasource);
  }

  // json representation without the actual data (for import list)
  @AllArgsConstructor
  @Getter
  public static class MetaData {
    private final Long id;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", locale = "UTC")
    private final Date timestamp;

    private final ValidationMetaData.HealthStatus health;

    private final String errorMessages;

    @JsonIgnore
    private final Datasource datasource;

    public String getLocation() {
      return Mappings.DATASOURCE_PATH + "/" + datasource.getId() + Mappings.DATAIMPORT_PATH + "/" + id + Mappings.DATA_PATH;
    }
  }
}
