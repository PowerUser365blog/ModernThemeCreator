async function publishModernTheme(executionContext) {
    debugger;
    Xrm.Utility.showProgressIndicator("Please wait...");
    var formContext = executionContext.getFormContext != null ? executionContext.getFormContext() : executionContext;
    var solutionUniqueName = "pwuser_theme_solution";
    var themeId = formContext.data.entity.getId();
    var entityName = "pwuser_theme";
    var fieldName = "statuscode";
    var draft = 1;
    var publishedApp = 946700002;
    var solutionApp = null;
    var webResourceAttribute = formContext.data.entity.attributes.get("pwuser_webresourceid");
    var themeName = formContext.data.entity.attributes.get("pwuser_name").getValue();
    var appId = formContext.data.entity.attributes.get("pwuser_appid").getValue();
    var appUniqueName = null;
    var webResourceId = webResourceAttribute.getValue();
    var webResourceName = await getwebResourceName(webResourceId);
    var settingId = await getSettingId("OverrideAppHeaderColor");
    if (webResourceName != null) {
        if (appId != null) {
            appUniqueName = await getAppUniqueName(appId);
            solutionApp = await createSolutionWithApp(themeName, appId);
            if (solutionApp != null) {
                await addSolutionComponent(solutionApp.uniquename, settingId, 10030);
                await addSolutionComponent(solutionApp.uniquename, appId, 80);
            }
            var execute_SaveSettingValue_Request = {
                AppUniqueName: appUniqueName,
                SettingName: "OverrideAppHeaderColor",
                Value: webResourceName,
                getMetadata: function () {
                    return {
                        boundParameter: null,
                        parameterTypes: {
                            AppUniqueName: { typeName: "Edm.String", structuralProperty: 1 },
                            SettingName: { typeName: "Edm.String", structuralProperty: 1 },
                            Value: { typeName: "Edm.String", structuralProperty: 1 },
                            //SolutionUniqueName: { typeName: "Edm.String", structuralProperty: 1 }
                        },
                        operationType: 0, operationName: "SaveSettingValue"
                    };
                }
            };
        } else {
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
        }
        Xrm.WebApi.execute(execute_SaveSettingValue_Request).then(
            async function success(response) {
                debugger;
                if (response.ok) {
                    console.log("Success");
                    var fetchXml = "";
                    var solutionExist = await getSolution(solutionUniqueName);
                    var orgSettingValueId = await getSettingValueId(settingId);
                    if (appId == null) {
                        formContext.getAttribute("statuscode").setValue(946700001);
                        fetchXml = await getDefaultThemePublished(entityName, publishedApp);

                    } else {
                        formContext.getAttribute("statuscode").setValue(946700002);
                        var appSettingValueId = await getAppSettingValueId(settingId, appId);
                        fetchXml = await checkAppThemeDuplicated(entityName, publishedApp, appId);
                        if (solutionApp != null) {
                            addSolutionComponent(solutionApp.uniquename, appSettingValueId, 10027);
                        }
                        publishApp(appId);

                    }
                    await updateFieldInRecords(entityName, fetchXml, draft, fieldName);
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
    Xrm.Utility.closeProgressIndicator();
}

async function getAppUniqueName(appId) {
    var appUniqueName = "";
    await Xrm.WebApi.retrieveRecord("appmodule", appId, "?$select=uniquename").then(
        function success(results) {
            console.log(results);
            appUniqueName = results["uniquename"];
        },
        function (error) {
            console.log(error.message);
        }
    );
    return appUniqueName;
}

async function getAppSettingValueId(settingId, appId) {
    var AppSettingId = "";
    await Xrm.WebApi.retrieveMultipleRecords("appsetting", "?$filter=(_parentappmoduleid_value eq '" + appId + "'and _settingdefinitionid_value eq '" + settingId + "')").then(
        function success(results) {
            console.log(results);
            if (results.entities.length > 0) {
                AppSettingId = results.entities[0]["componentidunique"];
            }
        },
        function (error) {
            console.log(error.message);
        }
    );
    return AppSettingId;

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
    await Xrm.WebApi.retrieveMultipleRecords("solution", "?$filter=uniquename eq '" + solutionUniqueName + "'").then(
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
    await Xrm.WebApi.retrieveMultipleRecords("settingdefinition", "?$filter=uniquename eq '" + settingUniqueName + "'").then(
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
        ComponentId: { guid: settingId },
        ComponentType: componentType,
        AddRequiredComponents: false,
        getMetadata: function () {
            return {
                boundParameter: null,
                parameterTypes: {
                    ComponentId: { typeName: "Edm.Guid", structuralProperty: 1 },
                    ComponentType: { typeName: "Edm.Int32", structuralProperty: 1 },
                    SolutionUniqueName: { typeName: "Edm.String", structuralProperty: 1 },
                    AddRequiredComponents: { typeName: "Edm.Boolean", structuralProperty: 1 }
                },
                operationType: 0, operationName: "AddSolutionComponent"
            };
        }
    };
    Xrm.WebApi.execute(execute_AddSolutionComponent_Request).then(
        function success(response) {
            if (response.ok) { return response.json(); }
        }
    ).then(function (responseBody) {
        var result = responseBody;
        console.log(result);
        // Return Type: mscrm.AddSolutionComponentResponse
        // Output Parameters
        var id = result["id"]; // Edm.Guid
    }).catch(function (error) {
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

async function updateFieldInRecords(entityName, fetchXml, draft, fieldName) {

    try {

        var results = await Xrm.WebApi.retrieveMultipleRecords(entityName, "?fetchXml=" + fetchXml);

        for (var entity of results.entities) {
            var entityId = entity[entityName + "id"];
            var entityToUpdate = {};
            entityToUpdate[fieldName] = draft;

            await Xrm.WebApi.updateRecord(entityName, entityId, entityToUpdate);
            console.log("Registro actualizado: " + entityId);
        }

        console.log("Todas las actualizaciones completadas.");
    } catch (error) {
        console.log("Error al actualizar registros: " + error.message);
    }
}

function checkAppThemeDuplicated(entityName, publishedApp, appId) {
    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
        "  <entity name='" + entityName + "'>" +
        "    <attribute name='" + entityName + "id' />" +
        "<filter>" +
        "     <condition attribute='statuscode' operator='eq' value='" + publishedApp + "'/>" +
        "     <condition attribute='pwuser_appid' operator='eq' value='" + appId + "'/>" +
        "</filter>" +
        "  </entity>" +
        "</fetch>";

    return fetchXml;
}

function getDefaultThemePublished(entityName, publishedApp) {
    var fetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>" +
        "  <entity name='" + entityName + "'>" +
        "    <attribute name='" + entityName + "id' />" +
        "<filter>" +
        "     <condition attribute='statuscode' operator='ne' value='" + publishedApp + "'/>" +
        "</filter>" +
        "  </entity>" +
        "</fetch>";

    return fetchXml;
}

async function createSolutionWithApp(themeName, appId,) {
    var publisherName = "pwuser";
    var publisherId = await getPublisher(publisherName);
    var record = {};
    record.uniquename = "pwuser_appTheme" + themeName; // Text
    record["publisherid@odata.bind"] = "/publishers(" + publisherId + ")"; // Lookup
    record.friendlyname = "pwuser_appTheme" + themeName;
    record.description = "Solution to manage App theme";
    record.version = "1.0";
    var solutionExist = await getSolution(record.uniquename);
    if (!solutionExist) {
        try {
            solutionObj = await Xrm.WebApi.createRecord("solution", record);
        } catch {
            console.log("Error creating the solution: " + error.message);
        }
        var solution = {};
        solution.id = solutionObj.id;
        solution.uniquename = record.uniquename;

        return solution;
    } else {
        return null
    }
}

function publishApp(appId) {
    var execute_PublishXml_Request = {
        ParameterXml: "<importexportxml><appmodules><appmodule>{" + appId + "}</appmodule></appmodules></importexportxml>",
        getMetadata: function () {
            return {
                boundParameter: null,
                parameterTypes: {
                    ParameterXml: { typeName: "Edm.String", structuralProperty: 1 }
                },
                operationType: 0, operationName: "PublishXml"
            };
        }
    };
    Xrm.WebApi.execute(execute_PublishXml_Request).then(
        function success(response) {
            if (response.ok) { console.log("Success"); }
        }
    ).catch(function (error) {
        console.log(error.message);
    });
}
async function getPublisher(publisherName) {
    try {
        var result = await Xrm.WebApi.retrieveMultipleRecords("publisher", "?$select=publisherid&$filter=customizationprefix eq '" + publisherName + "'");

        if (result.entities.length > 0) {
            var publisherId = result.entities[0].publisherid;
            return publisherId;
        } else {
            console.log("No se encontró ningún publisher con el nombre " + publisherName);
            return null;
        }
    } catch (error) {
        console.log("Error al recuperar el publisher:", error.message);
        return null;
    }
}

