package org.jvalue.ods.adapterservice.datasource.model;

import java.io.IOException;
import java.text.ParseException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import static org.jvalue.ods.adapterservice.adapter.Format.JSON;
import static org.jvalue.ods.adapterservice.adapter.Protocol.HTTP;
import static org.jvalue.ods.adapterservice.datasource.TestHelper.generateDatasource;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class DataImportTest {
  private final ObjectMapper mapper = new ObjectMapper();

  @Test
  public void testSerialization() throws ParseException, IOException {
    Datasource datasource = generateDatasource(HTTP, JSON, "http://www.test-url.com/");
    String jsonString ="{\"whateverwillbe\":\"willbe\",\"quesera\":\"sera\"}";
    DataImport dataImport = new DataImport(datasource, jsonString);

    JsonNode result = mapper.valueToTree(dataImport);

    assertEquals(5, result.size());
    assertEquals("null", result.get("id").asText());
    assertEquals("{\"whateverwillbe\":\"willbe\",\"quesera\":\"sera\"}", result.get("data").asText());
  }

  @Test
  public void testMetaDataSerialization() throws ParseException, IOException {
    Datasource datasource = generateDatasource(HTTP, JSON, "http://www.test-url.com/");
    String jsonString = "{\"whateverwillbe\":\"willbe\",\"quesera\":\"sera\"}";
    DataImport dataImport = new DataImport(datasource, jsonString);

    JsonNode result = mapper.valueToTree(dataImport.getMetaData());

    assertEquals(5, result.size());
    assertEquals("null", result.get("id").asText());
    assertEquals("/datasources/null/imports/null/data", result.get("location").asText());
  }
}
