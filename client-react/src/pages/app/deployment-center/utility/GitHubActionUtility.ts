import {
  CodeWorkflowInformation,
  ContainerWorkflowInformation,
  WorkflowOption,
  SiteSourceControlRequestBody,
} from '../DeploymentCenter.types';
import { RuntimeStacks, JavaContainers } from '../../../../utils/stacks-utils';
import { getWorkflowFileName, getLogId } from './DeploymentCenterUtility';
import DeploymentCenterData from '../DeploymentCenter.data';
import LogService from '../../../../utils/LogService';
import { LogCategories } from '../../../../utils/LogCategories';
import { DeploymentCenterConstants } from '../DeploymentCenterConstants';

export const updateGitHubActionSourceControlPropertiesManually = async (
  deploymentCenterData: DeploymentCenterData,
  resourceId: string,
  payload: SiteSourceControlRequestBody
) => {
  // NOTE(michinoy): To be on the safe side, the update operations should be sequential rather than
  // parallel. The reason behind this is because incase the metadata update fails, but the scmtype is updated
  // the /sourcecontrols API GET will start failing.

  const fetchExistingMetadataResponse = await deploymentCenterData.getConfigMetadata(resourceId);

  if (!fetchExistingMetadataResponse.metadata.success) {
    LogService.error(LogCategories.deploymentCenter, getLogId('GitHubActionUtility', 'updateGitHubActionSourceControlPropertiesManually'), {
      error: fetchExistingMetadataResponse.metadata.error,
    });

    return fetchExistingMetadataResponse;
  }

  const properties = fetchExistingMetadataResponse.data.properties;
  delete properties['RepoUrl'];
  delete properties['ScmUri'];
  delete properties['CloneUri'];
  delete properties['branch'];

  properties['RepoUrl'] = payload.repoUrl;
  properties['branch'] = payload.branch;

  const updateMetadataResponse = await deploymentCenterData.updateConfigMetadata(resourceId, properties);

  if (!updateMetadataResponse.metadata.success) {
    LogService.error(LogCategories.deploymentCenter, getLogId('GitHubActionUtility', 'updateGitHubActionSourceControlPropertiesManually'), {
      error: updateMetadataResponse.metadata.error,
    });

    return updateMetadataResponse;
  }

  const patchSiteConfigResponse = await deploymentCenterData.patchSiteConfig(resourceId, {
    properties: {
      scmType: 'GitHubAction',
    },
  });

  if (!patchSiteConfigResponse.metadata.success) {
    LogService.error(LogCategories.deploymentCenter, getLogId('GitHubActionUtility', 'updateGitHubActionSourceControlPropertiesManually'), {
      error: patchSiteConfigResponse.metadata.error,
    });
  }

  return patchSiteConfigResponse;
};

// Detect the specific error which is indicative of Ant89 Geo/Stamp sync issues.
export const isApiSyncError = (error?: any): boolean => {
  return (
    error &&
    error.Message &&
    error.Message.indexOf &&
    error.Message.indexOf('500 (InternalServerError)') > -1 &&
    error.Message.indexOf('GeoRegionServiceClient') > -1
  );
};

export const isWorkflowOptionExistingOrAvailable = (workflowOption: string): boolean => {
  return workflowOption === WorkflowOption.UseExistingWorkflowConfig || workflowOption === WorkflowOption.UseAvailableWorkflowConfigs;
};

export const getContainerAppWorkflowInformation = (
  serverUrl: string,
  image: string,
  branch: string,
  publishingProfileSecretNameGuid: string,
  containerUsernameSecretNameGuid: string,
  containerPasswordSecretNameGuid: string,
  siteName: string,
  slotName: string
): ContainerWorkflowInformation => {
  const fileName = getWorkflowFileName(branch, siteName, slotName);
  const publishingProfileSecretName = `AzureAppService_PublishProfile_${publishingProfileSecretNameGuid}`;
  const containerUsernameSecretName = `AzureAppService_ContainerUsername_${containerUsernameSecretNameGuid}`;
  const containerPasswordSecretName = `AzureAppService_ContainerPassword_${containerPasswordSecretNameGuid}`;

  const content = getContainerGithubActionWorkflowDefinition(
    siteName,
    slotName,
    branch,
    publishingProfileSecretName,
    containerUsernameSecretName,
    containerPasswordSecretName,
    serverUrl,
    image
  );

  return {
    fileName,
    content,
    publishingProfileSecretName,
    containerUsernameSecretName,
    containerPasswordSecretName,
  };
};

export const getCodeAppWorkflowInformation = (
  runtimeStack: string,
  runtimeVersion: string,
  runtimeStackRecommendedVersion: string,
  branch: string,
  isLinuxApp: boolean,
  secretNameGuid: string,
  siteName: string,
  slotName: string
): CodeWorkflowInformation => {
  branch = branch || 'master';
  const fileName = getWorkflowFileName(branch, siteName, slotName);
  const secretName = `AzureAppService_PublishProfile_${secretNameGuid}`;

  let content = '';
  const runtimeStackVersion = getRuntimeVersion(isLinuxApp, runtimeVersion, runtimeStackRecommendedVersion);

  switch (runtimeStack) {
    case RuntimeStacks.node:
      content = getNodeGithubActionWorkflowDefinition(siteName, slotName, branch, isLinuxApp, secretName, runtimeStackVersion);
      break;
    case RuntimeStacks.python:
      content = isLinuxApp
        ? getPythonGithubActionWorkflowDefinitionForLinux(siteName, slotName, branch, secretName, runtimeStackVersion)
        : getPythonGithubActionWorkflowDefinitionForWindows(siteName, slotName, branch, secretName, runtimeStackVersion);
      break;
    case RuntimeStacks.dotnetcore:
      content = getDotnetCoreGithubActionWorkflowDefinition(siteName, slotName, branch, isLinuxApp, secretName, runtimeStackVersion);
      break;
    case RuntimeStacks.java8:
    case RuntimeStacks.java11:
      if (isJavaWarBuild(runtimeVersion)) {
        content = getJavaWarGithubActionWorkflowDefinition(siteName, slotName, branch, isLinuxApp, secretName, runtimeStackVersion);
      } else {
        content = getJavaJarGithubActionWorkflowDefinition(siteName, slotName, branch, isLinuxApp, secretName, runtimeStackVersion);
      }
      break;
    case RuntimeStacks.aspnet:
      content = getAspNetGithubActionWorkflowDefinition(siteName, slotName, branch, secretName, runtimeStackVersion);
      break;
    default:
      throw Error(`Incorrect stack value '${runtimeStack}' provided.`);
  }

  return {
    fileName,
    secretName,
    content,
  };
};

const isJavaWarBuild = (runtimeVersion: string) => {
  return runtimeVersion.toLocaleLowerCase().indexOf(JavaContainers.Tomcat) > -1;
};

const getRuntimeVersion = (isLinuxApp: boolean, runtimeVersion: string, runtimeStackRecommendedVersion: string) => {
  if (runtimeStackRecommendedVersion) {
    return runtimeStackRecommendedVersion;
  } else {
    return isLinuxApp ? runtimeVersion.split('|')[1] : runtimeVersion;
  }
};

// TODO(michinoy): Need to implement templated github action workflow generation.
// Current reference - https://github.com/Azure/actions-workflow-templates
const getNodeGithubActionWorkflowDefinition = (
  siteName: string,
  slotName: string,
  branch: string,
  isLinuxApp: boolean,
  secretName: string,
  runtimeStackVersion: string
) => {
  const webAppName = slotName ? `${siteName}(${slotName})` : siteName;
  const slot = slotName || 'production';

  return `# Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
# More GitHub Actions for Azure: https://github.com/Azure/actions

name: Build and deploy Node.js app to Azure Web App - ${webAppName}

on:
  push:
    branches:
      - ${branch}

jobs:
  build-and-deploy:
    runs-on: ${isLinuxApp ? 'ubuntu-latest' : 'windows-latest'}

    steps:
    - uses: actions/checkout@master

    - name: Set up Node.js version
      uses: actions/setup-node@v1
      with:
        node-version: '${runtimeStackVersion}'

    - name: npm install, build, and test
      run: |
        npm install
        npm run build --if-present
        npm run test --if-present

    - name: 'Deploy to Azure Web App'
      uses: azure/webapps-deploy@v2
      with:
        app-name: '${webAppName}'
        slot-name: '${slot}'
        publish-profile: \${{ secrets.${secretName} }}
        package: .`;
};

// TODO(michinoy): Need to implement templated github action workflow generation.
// Current reference - https://github.com/Azure/actions-workflow-templates
const getPythonGithubActionWorkflowDefinitionForWindows = (
  siteName: string,
  slotName: string,
  branch: string,
  secretName: string,
  runtimeStackVersion: string
) => {
  const webAppName = slotName ? `${siteName}(${slotName})` : siteName;
  const slot = slotName || 'production';

  return `# Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
# More GitHub Actions for Azure: https://github.com/Azure/actions

name: Build and deploy Python app to Azure Web App - ${webAppName}

on:
  push:
    branches:
      - ${branch}

jobs:
  build-and-deploy:
    runs-on: windows-latest

    steps:
    - uses: actions/checkout@master

    - name: Set up Python version
      uses: actions/setup-python@v1
      with:
        python-version: '${runtimeStackVersion}'

    - name: Install Python dependencies
      run: |
        python -m venv env
        .\\env\\Scripts\\activate
        pip install -r requirements.txt

    - name: Zip the application files
      run: Compress-Archive .\\* app.zip

    - name: 'Deploy to Azure Web App'
      uses: azure/webapps-deploy@v2
      with:
        app-name: '${webAppName}'
        slot-name: '${slot}'
        publish-profile: \${{ secrets.${secretName} }}
        package: '.\\app.zip'`;
};

// TODO(michinoy): Need to implement templated github action workflow generation.
// Current reference - https://github.com/Azure/actions-workflow-templates
const getPythonGithubActionWorkflowDefinitionForLinux = (
  siteName: string,
  slotName: string,
  branch: string,
  secretName: string,
  runtimeStackVersion: string
) => {
  const webAppName = slotName ? `${siteName}(${slotName})` : siteName;
  const slot = slotName || 'production';

  return `# Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
# More GitHub Actions for Azure: https://github.com/Azure/actions

name: Build and deploy Python app to Azure Web App - ${webAppName}

on:
  push:
    branches:
      - ${branch}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@master

    - name: Set up Python version
      uses: actions/setup-python@v1
      with:
        python-version: '${runtimeStackVersion}'

    - name: Build using AppService-Build
      uses: azure/appservice-build@v2
      with:
        platform: python
        platform-version: '${runtimeStackVersion}'

    - name: 'Deploy to Azure Web App'
      uses: azure/webapps-deploy@v2
      with:
        app-name: '${webAppName}'
        slot-name: '${slot}'
        publish-profile: \${{ secrets.${secretName} }}`;
};

// TODO(michinoy): Need to implement templated github action workflow generation.
// Current reference - https://github.com/Azure/actions-workflow-templates
const getDotnetCoreGithubActionWorkflowDefinition = (
  siteName: string,
  slotName: string,
  branch: string,
  isLinuxApp: boolean,
  secretName: string,
  runtimeStackVersion: string
) => {
  const webAppName = slotName ? `${siteName}(${slotName})` : siteName;
  const slot = slotName || 'production';

  return `# Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
# More GitHub Actions for Azure: https://github.com/Azure/actions

name: Build and deploy ASP.Net Core app to Azure Web App - ${webAppName}

on:
  push:
    branches:
      - ${branch}

jobs:
  build-and-deploy:
    runs-on: ${isLinuxApp ? 'ubuntu-latest' : 'windows-latest'}

    steps:
    - uses: actions/checkout@master

    - name: Set up .NET Core
      uses: actions/setup-dotnet@v1
      with:
        dotnet-version: '${runtimeStackVersion}'

    - name: Build with dotnet
      run: dotnet build --configuration Release

    - name: dotnet publish
      run: dotnet publish -c Release -o \${{env.DOTNET_ROOT}}/myapp

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: '${webAppName}'
        slot-name: '${slot}'
        publish-profile: \${{ secrets.${secretName} }}
        package: \${{env.DOTNET_ROOT}}/myapp `;
};

// TODO(michinoy): Need to implement templated github action workflow generation.
// Current reference - https://github.com/Azure/actions-workflow-templates
const getJavaJarGithubActionWorkflowDefinition = (
  siteName: string,
  slotName: string,
  branch: string,
  isLinuxApp: boolean,
  secretName: string,
  runtimeStackVersion: string
) => {
  const webAppName = slotName ? `${siteName}(${slotName})` : siteName;
  const slot = slotName || 'production';

  return `# Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
# More GitHub Actions for Azure: https://github.com/Azure/actions

name: Build and deploy JAR app to Azure Web App - ${webAppName}

on:
  push:
    branches:
      - ${branch}

jobs:
  build-and-deploy:
    runs-on: ${isLinuxApp ? 'ubuntu-latest' : 'windows-latest'}

    steps:
    - uses: actions/checkout@master

    - name: Set up Java version
      uses: actions/setup-java@v1
      with:
        java-version: '${runtimeStackVersion}'

    - name: Build with Maven
      run: mvn clean install

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: '${webAppName}'
        slot-name: '${slot}'
        publish-profile: \${{ secrets.${secretName} }}
        package: '\${{ github.workspace }}/target/*.jar'`;
};

// TODO(michinoy): Need to implement templated github action workflow generation.
// Current reference - https://github.com/Azure/actions-workflow-templates
const getJavaWarGithubActionWorkflowDefinition = (
  siteName: string,
  slotName: string,
  branch: string,
  isLinuxApp: boolean,
  secretName: string,
  runtimeStackVersion: string
) => {
  const webAppName = slotName ? `${siteName}(${slotName})` : siteName;
  const slot = slotName || 'production';

  return `# Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
# More GitHub Actions for Azure: https://github.com/Azure/actions

name: Build and deploy WAR app to Azure Web App - ${webAppName}

on:
  push:
    branches:
      - ${branch}

jobs:
  build-and-deploy:
    runs-on: ${isLinuxApp ? 'ubuntu-latest' : 'windows-latest'}

    steps:
    - uses: actions/checkout@master

    - name: Set up Java version
      uses: actions/setup-java@v1
      with:
        java-version: '${runtimeStackVersion}'

    - name: Build with Maven
      run: mvn clean install

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: '${siteName}'
        slot-name: '${slot}'
        publish-profile: \${{ secrets.${secretName} }}
        package: '\${{ github.workspace }}/target/*.war'`;
};

// TODO(michinoy): Need to implement templated github action workflow generation.
// Current reference - https://github.com/Azure/actions-workflow-templates
const getAspNetGithubActionWorkflowDefinition = (
  siteName: string,
  slotName: string,
  branch: string,
  secretName: string,
  runtimeStackVersion: string
) => {
  const webAppName = slotName ? `${siteName}(${slotName})` : siteName;
  const slot = slotName || 'production';

  return `# Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
# More GitHub Actions for Azure: https://github.com/Azure/actions

name: Build and deploy WAR app to Azure Web App - ${webAppName}

on:
  push:
    branches:
      - ${branch}

jobs:
  build-and-deploy:
    runs-on: 'windows-latest'

    steps:
    - uses: actions/checkout@master

    - name: Setup MSBuild path
      uses: microsoft/setup-msbuild@v1.0.0

    - name: Setup NuGet
      uses: NuGet/setup-nuget@v1.0.2

    - name: Restore NuGet packages
      run: nuget restore

    - name: Publish to folder
      run: msbuild /nologo /verbosity:m /t:Build /t:pipelinePreDeployCopyAllFilesToOneFolder /p:_PackageTempDir="\\published\\"

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: '${siteName}'
        slot-name: '${slot}'
        publish-profile: \${{ secrets.${secretName} }}
        package: \\published\\`;
};

// TODO(michinoy): Need to implement templated github action workflow generation.
// Current reference - https://github.com/Azure/actions-workflow-templates
const getContainerGithubActionWorkflowDefinition = (
  siteName: string,
  slotName: string,
  branch: string,
  publishingProfileSecretName: string,
  containerUsernameSecretName: string,
  containerPasswordSecretName: string,
  serverUrl: string,
  image: string
) => {
  const webAppName = slotName ? `${siteName}(${slotName})` : siteName;
  const slot = slotName || 'production';
  const loginServer = serverUrl.toLocaleLowerCase();

  // NOTE(michinoy): For dockerHub the server URL contains /v1 at the end.
  // The server used in the image should not have that part.
  const server =
    loginServer.indexOf(DeploymentCenterConstants.dockerHubServerUrlHost) > -1
      ? DeploymentCenterConstants.dockerHubServerUrlHost
      : loginServer.replace('https://', '');

  return `# Docs for the Azure Web Apps Deploy action: https://github.com/Azure/webapps-deploy
# More GitHub Actions for Azure: https://github.com/Azure/actions

name: Build and deploy container app to Azure Web App - ${webAppName}

on:
  push:
    branches:
      - ${branch}

jobs:
  build-and-deploy:
    runs-on: 'ubuntu-latest'

    steps:
    - uses: actions/checkout@master

    - uses: azure/docker-login@v1
      with:
        login-server: ${loginServer}/
        username: \${{ secrets.${containerUsernameSecretName} }}
        password: \${{ secrets.${containerPasswordSecretName} }}

    - run: |
        docker build . -t ${server}/\${{ secrets.${containerUsernameSecretName} }}/${image}:\${{ github.sha }}
        docker push ${server}/\${{ secrets.${containerUsernameSecretName} }}/${image}:\${{ github.sha }}

    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: '${siteName}'
        slot-name: '${slot}'
        publish-profile: \${{ secrets.${publishingProfileSecretName} }}
        images: '${server}/\${{ secrets.${containerUsernameSecretName} }}/${image}:\${{ github.sha }}'`;
};
