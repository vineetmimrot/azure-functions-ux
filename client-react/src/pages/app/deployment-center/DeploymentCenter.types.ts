import { ArmArray } from '../../../models/arm-obj';
import { FormikProps } from 'formik';
import * as Yup from 'yup';
import { ScmType, BuildProvider } from '../../../models/site/config';
import moment from 'moment';
import { Uri } from 'monaco-editor';
import { GitHubUser } from '../../../models/github';
import { IDropdownOption, IChoiceGroupOption, MessageBarType } from 'office-ui-fabric-react';
import { BitbucketUser } from '../../../models/bitbucket';
import { RepoTypeOptions } from '../../../models/external';

export enum ContainerOptions {
  docker = 'docker',
  compose = 'compose',
  kubernetes = 'kube',
}

export enum ContainerRegistrySources {
  acr = 'acr',
  docker = 'docker',
  privateRegistry = 'privateRegistry',
}

export enum ContainerDockerAccessTypes {
  public = 'public',
  private = 'private',
}

export enum ContinuousDeploymentOption {
  on = 'on',
  off = 'off',
}

export enum DeploymentStatus {
  Pending,
  Building,
  Deploying,
  Failed,
  Success,
}

export enum WorkflowOption {
  None = 'none',
  Overwrite = 'overwrite',
  Add = 'add',
  UseAvailableWorkflowConfigs = 'useAvailableWorkflowConfigs',
  UseExistingWorkflowConfig = 'useExistingWorkflowConfig',
}

export enum WorkflowFileDeleteOptions {
  Preserve = 'Preserve',
  Delete = 'Delete',
}

export interface DeploymentCenterDataLoaderProps {
  resourceId: string;
}

export interface RefreshableComponent {
  refresh: () => void;
}

export type DeploymentCenterContainerProps = DeploymentCenterContainerLogsProps & DeploymentCenterFtpsProps & RefreshableComponent;

export type DeploymentCenterCodeProps = DeploymentCenterCodeLogsProps & DeploymentCenterFtpsProps & RefreshableComponent;

export type DeploymentCenterYupValidationSchemaType<
  T = DeploymentCenterContainerFormData | DeploymentCenterCodeFormData
> = Yup.ObjectSchema<Yup.Shape<object, DeploymentCenterFormData<T>>>;

export type DeploymentCenterFormData<
  T = DeploymentCenterCodeFormData | DeploymentCenterContainerFormData
> = DeploymentCenterCommonFormData & T;

export interface DeploymentCenterCommonFormData {
  publishingUsername: string;
  publishingPassword: string;
  publishingConfirmPassword: string;
  workflowOption: string;
  org: string;
  repo: string;
  branch: string;
  gitHubPublishProfileSecretGuid: string;
  externalRepoType: RepoTypeOptions;
  externalUsername?: string;
  externalPassword?: string;
  gitHubUser?: GitHubUser;
  bitbucketUser?: BitbucketUser;
}

export interface AcrFormData {
  acrLoginServer: string;
  acrImage: string;
  acrTag: string;
  acrUsername: string;
  acrPassword: string;
  acrComposeYml: string;
  acrResourceId: string;
  acrLocation: string;
}

export interface DockerHubFormData {
  dockerHubAccessType: ContainerDockerAccessTypes;
  dockerHubImageAndTag: string;
  dockerHubUsername: string;
  dockerHubPassword: string;
  dockerHubComposeYml: string;
}

export interface PrivateRegistryFormData {
  privateRegistryServerUrl: string;
  privateRegistryImageAndTag: string;
  privateRegistryUsername: string;
  privateRegistryPassword: string;
  privateRegistryComposeYml: string;
}

export interface DeploymentCenterContainerFormData extends AcrFormData, DockerHubFormData, PrivateRegistryFormData {
  option: ContainerOptions;
  registrySource: ContainerRegistrySources;
  scmType: ScmType;
  command: string;
  gitHubContainerUsernameSecretGuid: string;
  gitHubContainerPasswordSecretGuid: string;
  continuousDeploymentOption: ContinuousDeploymentOption;
}

export interface DeploymentCenterCodeFormData {
  sourceProvider: ScmType;
  buildProvider: BuildProvider;
  runtimeStack: string;
  runtimeVersion: string;
  runtimeRecommendedVersion: string;
}

export interface DeploymentCenterFieldProps<T = DeploymentCenterContainerFormData | DeploymentCenterCodeFormData> {
  formProps: FormikProps<DeploymentCenterFormData<T>>;
}

export interface DeploymentCenterGitHubWorkflowConfigSelectorProps<T = DeploymentCenterContainerFormData | DeploymentCenterCodeFormData>
  extends DeploymentCenterFieldProps<T> {
  setGithubActionExistingWorkflowContents: (active: string) => void;
}

export interface DeploymentCenterContainerLogsProps {
  isLoading: boolean;
  logs?: string;
}

export interface DeploymentCenterCodeLogsProps {
  isLoading: boolean;
  deployments?: ArmArray<DeploymentProperties>;
  deploymentsError?: string;
  goToSettings?: () => void;
}

export interface DeploymentCenterCommitLogsProps {
  commitId?: string;
}

export interface DeploymentCenterGitHubWorkflowConfigPreviewProps {
  isPreviewFileButtonDisabled: boolean;
  getWorkflowFileContent: () => string;
  workflowFilePath?: string;
  panelMessage?: string;
  panelMessageType?: MessageBarType;
}

export interface DeploymentCenterFtpsProps {
  isLoading: boolean;
}

export interface DeploymentCenterFormProps<T = DeploymentCenterContainerFormData | DeploymentCenterCodeFormData> {
  isLoading: boolean;
  formData?: DeploymentCenterFormData<T>;
  formValidationSchema?: DeploymentCenterYupValidationSchemaType<T>;
}

export type DeploymentCenterContainerFormProps = DeploymentCenterContainerProps &
  DeploymentCenterFormProps<DeploymentCenterContainerFormData>;

export type DeploymentCenterContainerPivotProps = DeploymentCenterContainerFormProps &
  DeploymentCenterFieldProps<DeploymentCenterContainerFormData>;

export type DeploymentCenterCodeFormProps = DeploymentCenterCodeProps & DeploymentCenterFormProps<DeploymentCenterCodeFormData>;

export type DeploymentCenterCodePivotProps = DeploymentCenterCodeFormProps & DeploymentCenterFieldProps<DeploymentCenterCodeFormData>;

export interface DeploymentCenterCommandBarProps {
  isLoading: boolean;
  isDirty: boolean;
  saveFunction: () => void;
  discardFunction: () => void;
  showPublishProfilePanel: () => void;
  refresh: () => void;
  sync?: () => void;
}

export interface DeploymentCenterCodeCommandBarProps extends DeploymentCenterFieldProps<DeploymentCenterCodeFormData> {
  isLoading: boolean;
  refresh: () => void;
  sync: () => void;
}

export interface DeploymentCenterContainerCommandBarProps extends DeploymentCenterFieldProps<DeploymentCenterContainerFormData> {
  isLoading: boolean;
  refresh: () => void;
}

export interface DeploymentCenterPublishProfilePanelProps {
  isPanelOpen: boolean;
  dismissPanel: () => void;
  resetApplicationPassword: () => void;
}

export interface DeploymentCenterPublishProfileCommandBarProps {
  resetApplicationPassword: () => void;
}

export interface DeploymentCenterGitHubProviderProps<T = DeploymentCenterContainerFormData | DeploymentCenterCodeFormData>
  extends DeploymentCenterFieldProps<T> {
  authorizeAccount: () => void;
  organizationOptions: IDropdownOption[];
  repositoryOptions: IDropdownOption[];
  branchOptions: IDropdownOption[];
  loadingOrganizations: boolean;
  loadingRepositories: boolean;
  loadingBranches: boolean;
  accountStatusMessage?: string;
  accountUser?: GitHubUser;
}

export interface DeploymentCenterGitHubConfiguredViewProps {
  isGitHubActionsSetup?: boolean;
}

export interface DeploymentCenterGitHubDisconnectProps {
  branch: string;
  org: string;
  repo: string;
  repoUrl: string;
}

export interface DeploymentCenterCodeBuildCalloutProps {
  selectedBuildChoice: BuildProvider;
  updateSelectedBuildChoiceOption: (e: any, option: BuildChoiceGroupOption) => void;
  calloutOkButtonDisabled: boolean;
  toggleIsCalloutVisible: () => void;
  updateSelectedBuild: () => void;
}

export interface AuthorizationResult {
  timerId: NodeJS.Timeout;
  redirectUrl?: string;
}

export interface DeploymentProperties {
  id: string;
  status: DeploymentStatus;
  status_text: string;
  author_email: string;
  author: string;
  deployer: string;
  message: string;
  progress: string;
  received_time: string;
  start_time: string;
  complete: boolean;
  active: string;
  is_temp: boolean;
  is_readonly: boolean;
  url: Uri;
  log_url: Uri;
  site_name: string;
  end_time?: string;
  last_success_end_time?: string;
}

export interface DeploymentLogsItem {
  log_time: string;
  id: string;
  message: string;
  details_url: string;
}

export interface SourceControlProperties {
  deploymentRollbackEnabled: boolean;
  repoUrl: string;
  branch: string;
  isMercurial: boolean;
  isGitHubAction?: boolean;
}

export interface DateTimeObj {
  rawTime: moment.Moment;
}

export interface CodeDeploymentsRow {
  index: number;
  rawTime: moment.Moment;
  displayTime: string;
  commit: JSX.Element;
  checkinMessage: string;
  status: string;
}

export interface BuildChoiceGroupOption extends IChoiceGroupOption {
  buildType: BuildProvider;
}

export interface WorkflowDropdownOption extends IDropdownOption {
  workflowOption: WorkflowOption;
}

export interface RuntimeStackSetting {
  runtimeStack: string;
  runtimeVersion: string;
}

export class ContainerWorkflowInformation {
  fileName: string;
  content: string;
  publishingProfileSecretName: string;
  containerUsernameSecretName: string;
  containerPasswordSecretName: string;
}

export class CodeWorkflowInformation {
  fileName: string;
  secretName: string;
  content: string;
}

export interface DeploymentDisconnectStatus {
  step: DeployDisconnectStep;
  isSuccessful: boolean;
  errorMessage?: string;
  error?: any;
}

export enum DeployDisconnectStep {
  DeleteWorkflowFile = 'DeleteWorkflowFile',
  ClearSCMSettings = 'ClearSCMSettings',
}

export interface WorkflowChoiceGroupOption extends IChoiceGroupOption {
  workflowDeleteChoice: WorkflowFileDeleteOptions;
}

export interface SiteSourceControlRequestBody {
  repoUrl: string;
  branch: string;
  isManualIntegration: boolean;
  isGitHubAction: boolean;
  isMercurial: boolean;
}

export interface DeploymentCenterBitbucketProviderProps<T = DeploymentCenterContainerFormData | DeploymentCenterCodeFormData>
  extends DeploymentCenterFieldProps<T> {
  authorizeAccount: () => void;
  organizationOptions: IDropdownOption[];
  repositoryOptions: IDropdownOption[];
  branchOptions: IDropdownOption[];
  loadingOrganizations: boolean;
  loadingRepositories: boolean;
  loadingBranches: boolean;
  accountStatusMessage?: string;
  accountUser?: BitbucketUser;
}

export interface DeploymentCenterContainerAcrSettingsProps extends DeploymentCenterFieldProps<DeploymentCenterContainerFormData> {
  fetchImages: (loginServer: string) => void;
  fetchTags: (image: string) => void;
  acrRegistryOptions: IDropdownOption[];
  acrImageOptions: IDropdownOption[];
  acrTagOptions: IDropdownOption[];
  loadingRegistryOptions: boolean;
  loadingImageOptions: boolean;
  loadingTagOptions: boolean;
  acrStatusMessage?: string;
  acrStatusMessageType?: MessageBarType;
}
