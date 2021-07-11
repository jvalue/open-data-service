package org.jvalue.ods.adapterservice.datasource.validator;

import org.jvalue.ods.adapterservice.datasource.model.*;
import org.jvalue.ods.adapterservice.datasource.validator.ValidationMetaData;

public interface Validator {
    public ValidationMetaData validate(DataImport dataImport);
}

