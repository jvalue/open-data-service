package org.jvalue.ods.adapterservice.datasource.validator;

import org.jvalue.ods.adapterservice.datasource.validator.ValidationMetaData;
import org.jvalue.ods.adapterservice.datasource.model.*;
import org.jvalue.ods.adapterservice.datasource.model.exceptions.*;
import java.io.IOException;
import org.everit.json.schema.ValidationException;

import org.everit.json.schema.Schema;
import org.everit.json.schema.loader.SchemaLoader;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.util.List;
import java.lang.reflect.Type;

public class JsonSchemaValidator implements Validator {
  
  @Override
  public ValidationMetaData validate(DataImport dataImport){
    ValidationMetaData validationMetaData = new ValidationMetaData(dataImport.getHealth(), "");
    if (dataImport.getDatasource().getSchema() == null) {
      return new ValidationMetaData(ValidationMetaData.HealthStatus.OK, "");
    }
    try {
      String schemaString = new Gson().toJson(dataImport.getDatasource().getSchema());
      JSONObject rawSchema = new JSONObject(schemaString);
      Schema schema = SchemaLoader.load(rawSchema);
      String dataString = dataImport.getData();
      if (dataString.substring(0, 1).equals("[")) {
        schema.validate(new JSONArray(dataImport.getData()));
      }
      else {
        schema.validate(new JSONObject(dataImport.getData()));
      }

      validationMetaData.setHealthStatus(ValidationMetaData.HealthStatus.OK);
      return validationMetaData;
    } catch ( ValidationException e) {
      Type listType = new TypeToken<List<String>>() {}.getType();
      String errorMessagesAsString = new Gson().toJson(e.getAllMessages(), listType);

      validationMetaData.setErrorMessages(errorMessagesAsString);
      validationMetaData.setHealthStatus(ValidationMetaData.HealthStatus.WARNING);

      return validationMetaData;
    }
  }
}