 package org.jvalue.ods.adapterservice.datasource.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.persistence.Embeddable;
import javax.validation.constraints.NotNull;

import java.util.Date;

@Embeddable
@Getter
@Setter
@ToString
@NoArgsConstructor
@EqualsAndHashCode(exclude = "creationTimestamp")
public class DatasourceMetadata {

  @NotNull
  private String author;

  @NotNull
  private String displayName;

  @NotNull
  private String license;

  @NotNull
  private String description;

  @NotNull
  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", locale = "UTC")
  private Date creationTimestamp;

  @JsonCreator
  public DatasourceMetadata(
    @JsonProperty("author") String author,
    @JsonProperty("license") String license,
    @JsonProperty("displayName") String displayName,
    @JsonProperty("description") String description) {
    this.author = author;
    this.license = license;
    this.displayName = displayName;
    this.description = description;
    this.creationTimestamp = new Date();
  }
}
