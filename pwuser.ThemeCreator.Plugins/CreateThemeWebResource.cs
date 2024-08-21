using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using PowerUser365.Utils;
using System;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;

namespace pwuser.ThemeCreator.Plugins
{
    public class CreateThemeWebResource : IPlugin
    {
        private XmlDocument xmlTheme;
        private Guid webResourceId;

        public void Execute(IServiceProvider serviceProvider)
        {
            ITracingService tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            IOrganizationServiceFactory factory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = factory.CreateOrganizationService(context.UserId);
            Entity target = context.InputParameters.Contains("Target") ? (Entity)context.InputParameters["Target"] : null;
            
            var remote = context.ToRemoteExecutionContext();
            tracingService.Trace(remote.ToJson());

            var messageName = context.MessageName.ToLower();

            Entity theme = new Entity();

            if (messageName == "create")
            {
                theme = context.InputParameters.Contains("Target") ? (Entity)context.InputParameters["Target"] : null;
                if (theme != null)
                {
                    ExecutePluginCreate(service, tracingService, theme);
                }
            }
            else if (context.MessageName.ToLower() == "update")
            {
                theme = context.PostEntityImages.Contains("PostImage") ? (Entity)context.PostEntityImages["PostImage"] : null;
                if (theme != null)
                {
                    ExecutePluginUpdate(service, tracingService, theme);
                }
            }


        }

        private void ExecutePluginUpdate(IOrganizationService service, ITracingService tracingService, Entity theme)
        {
            xmlTheme = CreateXml(service, tracingService, theme);
            UpdatedWebresource(service, tracingService, theme, xmlTheme);
        }

        private void UpdatedWebresource(IOrganizationService service, ITracingService tracingService, Entity theme, XmlDocument xmlTheme)
        {
            Entity webResource = new Entity();
            webResourceId = new Guid(theme.GetAttributeValue<string>("pwuser_webresourceid"));
            try
            {
               webResource = service.Retrieve("webresource", webResourceId, new ColumnSet("content"));
            }
            catch (Exception ex)
            {
                string errorMessage = $"There was an error retrieving webresource because {ex.Message}";
                tracingService.Trace(errorMessage);
                throw new InvalidPluginExecutionException(errorMessage);
            }
            xmlTheme = CreateXml(service, tracingService, theme);
            string xmlContent = xmlTheme.OuterXml;
            webResource["content"] = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(xmlContent));
            PublishXmlRequest publishRequest = new PublishXmlRequest
            {
                ParameterXml = $"<importexportxml><webresources><webresource>{webResourceId}</webresource></webresources></importexportxml>"
            };
            UpdateRequest updaterequest = new UpdateRequest { Target = webResource };
            ExecuteMultipleRequest executemultiplerequest = new ExecuteMultipleRequest();
            executemultiplerequest.Settings = new ExecuteMultipleSettings();
            executemultiplerequest.Settings.ContinueOnError = false;
            executemultiplerequest.Settings.ReturnResponses = true;
            executemultiplerequest.Requests = new OrganizationRequestCollection();
            executemultiplerequest.Requests.Add(updaterequest);
            executemultiplerequest.Requests.Add(publishRequest);
            try
            {
                service.Execute(executemultiplerequest);
            }
            catch (Exception ex)
            {
                string errorMessage = $"There was an error updating the webresource because {ex.Message}";
                tracingService.Trace(errorMessage);
                throw new InvalidPluginExecutionException(errorMessage);
            }
        }

        private void ExecutePluginCreate(IOrganizationService service, ITracingService tracingService, Entity theme)
        {
            xmlTheme = CreateXml(service, tracingService, theme);
            webResourceId = ExecuteCreateThemeWebResource(service, tracingService, theme, xmlTheme);
            UpdateThemeEntity(service, tracingService, theme, webResourceId);
        }

        private XmlDocument CreateXml(IOrganizationService service, ITracingService tracingService, Entity theme)
        {
            XmlDocument xmlTheme = new XmlDocument();
            XmlElement appHeaderColorsNode = xmlTheme.CreateElement("AppHeaderColors");
            appHeaderColorsNode.SetAttribute("background", (string)theme["pwuser_background"]);
            appHeaderColorsNode.SetAttribute("foreground", (string)theme["pwuser_foreground"]);
            appHeaderColorsNode.SetAttribute("backgroundHover", (string)theme["pwuser_backgroundhover"]);
            appHeaderColorsNode.SetAttribute("foregroundHover", (string)theme["pwuser_foregroundhover"]);
            appHeaderColorsNode.SetAttribute("backgroundPressed", (string)theme["pwuser_backgroundpressed"]);
            appHeaderColorsNode.SetAttribute("foregroundPressed", (string)theme["pwuser_foregroundpressed"]);
            appHeaderColorsNode.SetAttribute("backgroundSelected", (string)theme["pwuser_backgroundselected"]);
            appHeaderColorsNode.SetAttribute("foregroundSelected", (string)theme["pwuser_foregroundselected"]);

            xmlTheme.AppendChild(appHeaderColorsNode);
            return xmlTheme;
        }

        private Guid ExecuteCreateThemeWebResource(IOrganizationService service, ITracingService tracingService, Entity theme, XmlDocument xmlTheme)
        {
            string xmlContent = xmlTheme.OuterXml;
            string themeNameSource = theme["pwuser_name"].ToString();
            string text1= themeNameSource.Normalize(NormalizationForm.FormD);
            string text2 = Regex.Replace(text1, @"\p{Mn}", "");
            string themeName = Regex.Replace(text2, @"[^a-zA-Z0-9]", "");
            string webresourceName = "pwuser_/theme" + themeName + ".xml";
            Entity webResource = new Entity();
            Guid id = Guid.NewGuid();
            webResource.Id = Guid.NewGuid();
            webResource.LogicalName = "webresource";
            webResource["name"] = webresourceName.Replace(" ", "");
            webResource["content"] = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(xmlContent));
            webResource["displayname"] = theme["pwuser_name"].ToString().ToLower().Replace(" ", "") + ".xml";
            webResource["description"] = "Modern theme";
            webResource["webresourcetype"] = new OptionSetValue(3);
            try { 
                
            id = service.Create(webResource); }
            catch (Exception ex)
            {
                string errorMessage = $"There was an error retrieving FullNameOrder because {ex.Message}";
                tracingService.Trace(errorMessage);
                throw new InvalidPluginExecutionException(errorMessage);
            }
            return id;

        }

        private void UpdateThemeEntity(IOrganizationService service, ITracingService tracingService, Entity theme, Guid webResource)
        {
            Entity themeToUpdate = new Entity("pwuser_theme");
            themeToUpdate.Id = theme.Id;
            themeToUpdate["pwuser_webresourceid"] = webResource.ToString();

            try
            {
                service.Update(themeToUpdate);
            }
            catch (Exception ex)
            {
                string errorMessage = $"There was an error updating the theme entity because {ex.Message}";
                tracingService.Trace(errorMessage);
                throw new InvalidPluginExecutionException(errorMessage);
            }
        }
    }
}
