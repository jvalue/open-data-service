package org.jvalue.ods.adapterservice.datasource.validator;

import lombok.*;

@AllArgsConstructor
@Getter
@Setter
public class ValidationMetaData {
  private HealthStatus healthStatus;
  private String errorMessages;

  public static enum HealthStatus {
    OK {
      public String toString() {
        return "OK";
      }
    },
    WARNING {
      public String toString() {
        return "WARNING";
      }
    },
    FAILED {
      public String toString() {
        return "FAILED";
      }
    }
  }
}
