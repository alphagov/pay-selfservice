import { Link } from "./link";
import { MerchantDetails } from "./merchant-details";
import {CustomBranding} from "./custom-branding";
import {ServiceName} from "./service-name";

export class Service {
    links?: Link[];
    agentInitiatedMotoEnabled?: boolean;
    archived?: boolean;
    collectBillingAddress?: boolean;
    createdDate?: Date;
    currentGoLiveStage?: ServiceCurrentGoLiveStageEnum;
    currentPspTestAccountStage?: ServiceCurrentPspTestAccountStageEnum;
    customBranding?: CustomBranding;
    defaultBillingAddressCountry?: string;
    experimentalFeaturesEnabled?: boolean;
    externalId?: string;
    gatewayAccountIds?: String[];
    id?: number;
    internal?: boolean;
    merchantDetails?: MerchantDetails;
    name?: string;
    redirectToServiceImmediatelyOnTerminalState?: boolean;
    sector?: string;
    serviceName?: ServiceName;
    wentLiveDate?: Date;
}

export enum ServiceCurrentGoLiveStageEnum {
    NOTSTARTED = 'NOT_STARTED',
    ENTEREDORGANISATIONNAME = 'ENTERED_ORGANISATION_NAME',
    ENTEREDORGANISATIONADDRESS = 'ENTERED_ORGANISATION_ADDRESS',
    CHOSENPSPSTRIPE = 'CHOSEN_PSP_STRIPE',
    CHOSENPSPWORLDPAY = 'CHOSEN_PSP_WORLDPAY',
    CHOSENPSPSMARTPAY = 'CHOSEN_PSP_SMARTPAY',
    CHOSENPSPEPDQ = 'CHOSEN_PSP_EPDQ',
    CHOSENPSPGOVBANKINGWORLDPAY = 'CHOSEN_PSP_GOV_BANKING_WORLDPAY',
    TERMSAGREEDSTRIPE = 'TERMS_AGREED_STRIPE',
    TERMSAGREEDWORLDPAY = 'TERMS_AGREED_WORLDPAY',
    TERMSAGREEDSMARTPAY = 'TERMS_AGREED_SMARTPAY',
    TERMSAGREEDEPDQ = 'TERMS_AGREED_EPDQ',
    TERMSAGREEDGOVBANKINGWORLDPAY = 'TERMS_AGREED_GOV_BANKING_WORLDPAY',
    DENIED = 'DENIED',
    LIVE = 'LIVE'
}

export enum ServiceCurrentPspTestAccountStageEnum {
    NOTSTARTED = 'NOT_STARTED',
    REQUESTSUBMITTED = 'REQUEST_SUBMITTED',
    CREATED = 'CREATED'
}

