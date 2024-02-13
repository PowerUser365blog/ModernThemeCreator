async function publishModernTheme(executionContext) {
    debugger;
    var formContext = executionContext.getFormContext != null ? executionContext.getFormContext() : executionContext;
    var solutionUniqueName = "pwuser_theme_solution";
    var themeId = formContext.data.entity.getId();
    var webResourceAttribute = formContext.data.entity.attributes.get("pwuser_webresourceid");
    var webResourceId = webResourceAttribute.getValue();
    var webResourceName = await getwebResourceName(webResourceId);
    if (webResourceName != null) {
        var execute_SaveSettingValue_Request = {
            SettingName: "OverrideAppHeaderColor",
            Value: webResourceName,
            getMetadata: function () {
                return {
                    boundParameter: null,
                    parameterTypes: {
                        SettingName: { typeName: "Edm.String", structuralProperty: 1 },
                        Value: { typeName: "Edm.String", structuralProperty: 1 },
                        //SolutionUniqueName: { typeName: "Edm.String", structuralProperty: 1 }
                    },
                    operationType: 0, operationName: "SaveSettingValue"
                };
            }
        };
        Xrm.WebApi.execute(execute_SaveSettingValue_Request).then(
            async function success(response) {
                debugger;
                if (response.ok) {
                    console.log("Success");
                    var solutionExist = await getSolution(solutionUniqueName);
                    var settingId = await getSettingId("OverrideAppHeaderColor");
                    var orgSettingValueId = await getSettingValueId(settingId);
                    await updateFieldInRecords();
                    formContext.getAttribute("statuscode").setValue(946700001);
                    formContext.data.entity.save();
                    if (solutionExist) {
                        addSolutionComponent(solutionUniqueName, settingId, 10030);
                        addSolutionComponent(solutionUniqueName, orgSettingValueId, 10029);
                    }

                }
            }
        ).catch(function (error) {
            console.log(error.message);
        });
    }
}

async function getwebResourceName(webResourceId) {
    var webresourceidunique = "";
    await Xrm.WebApi.retrieveRecord("webresource", webResourceId).then(
        function success(result) {
            console.log(result);
            webresourceidunique = result["name"];
        },
        function (error) {
            console.log(error.message);
        }
    );
    return webresourceidunique;
}


async function getSolution(solutionUniqueName) {
    var solutionExist = false;
    await Xrm.WebApi.retrieveMultipleRecords("solution", "?$filter=uniquename eq '"+solutionUniqueName+"'").then(
        function success(results) {
            console.log(results);
            if (results.entities.length > 0) {
                solutionExist = true;          
            };
        },
        function (error) {
            console.log(error.message);
        }
    );
return solutionExist;
}

async function getSettingId(settingUniqueName) {
    var settingId = "";
    await Xrm.WebApi.retrieveMultipleRecords("settingdefinition", "?$filter=uniquename eq '"+settingUniqueName+"'").then(
        function success(results) {
            console.log(results);
            if (results.entities.length > 0) {
                settingId = results.entities[0]["settingdefinitionid"];
            }
        },
        function (error) {
            console.log(error.message);
        }
    );
    return settingId;
}

async function getSettingValueId(settingId) {
    var settingValueId = "";
    await Xrm.WebApi.retrieveRecord("settingdefinition", settingId, "?$select=componentidunique").then(
        function success(results) {
            console.log(results);
            settingValueId = results["componentidunique"];
        },
        function (error) {
            console.log(error.message);
        }
    );
    return settingValueId;
};

function addSolutionComponent(solutionUniqueName, settingId, componentType) {
    var execute_AddSolutionComponent_Request = {
        SolutionUniqueName: solutionUniqueName,
        ComponentId: settingId,
        ComponentType: componentType,
        getMetadata: function () {
            return {
                boundParameter: null,
                parameterTypes: {
                    SolutionUniqueName: { typeName: "Edm.String", structuralProperty: 1 },
                    ComponentId: { typeName: "Edm.String", structuralProperty: 1 },
                    ComponentType: { typeName: "Edm.Int32", structuralProperty: 1 }
                },
                operationType: 0, operationName: "AddSolutionComponent"
            };
        }
    };
    Xrm.WebApi.execute(execute_AddSolutionComponent_Request).then(
        function success(response) {
            if (response.ok) { console.log("Success"); }
        }
    ).catch(function (error) {
        console.log(error.message);
    });
}

function showPublishButton(executionContext) {
    var formContext = executionContext.getFormContext != null ? executionContext.getFormContext() : executionContext;
    var themeStatus = formContext.getAttribute("statuscode").getValue();
    if (themeStatus == 1) {
        return true;
    }
    else {
        return false;
    }
};

async function updateFieldInRecords() {
    var entityName = "pwuser_theme";
    var fieldName = "statuscode"; 
    var newValue = 1; 

    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
        "  <entity name='" + entityName + "'>" +
        "    <attribute name='" + entityName + "id' />" +
        "  </entity>" +
        "</fetch>";

    try {
        
        var results = await Xrm.WebApi.retrieveMultipleRecords(entityName, "?fetchXml=" + fetchXml);

        for (var entity of results.entities) {
            var entityId = entity[entityName + "id"];
            var entityToUpdate = {};
            entityToUpdate[fieldName] = newValue;

            await Xrm.WebApi.updateRecord(entityName, entityId, entityToUpdate);
            console.log("Registro actualizado: " + entityId);
        }

        console.log("Todas las actualizaciones completadas.");
    } catch (error) {
        console.log("Error al actualizar registros: " + error.message);
    }
}

