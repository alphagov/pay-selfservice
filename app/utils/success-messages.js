module.exports = {
    forgottenPassword: {
        updated: 'Password has been updated'
    },
    manageTeamMembers: {
        teamMemberRemoved: username => `${username} was successfully removed`,
        inviteSent: invitee => `Invite sent to ${invitee}`,
        permissionUpdated: 'Permissions have been updated'
    },
    apiKeys: {
        revoked: 'The API key was successfully revoked',
        descriptionUpdated: 'The API key description was successfully updated'
    },
    billingAddress: {
        on: 'Billing address is turned on for this service',
        off: 'Billing address is turned off for this service'
    },
    applePay: {
        on: 'Apple Pay successfully enabled',
        off: 'Apple Pay successfully disabled'
    },
    googlePay: {
        on: 'Google Pay successfully enabled',
        off: 'Google Pay successfully disabled'
    },
    organisationDetails: {
        updated: 'Organisation details updated'
    },
    emailNotifications: {
        paymentConfirmationEmails: {
            on: 'Payment confirmation emails are turned on',
            off: 'Payment confirmation emails are turned off'
        },
        refundEmails: {
            on: 'Refund emails are turned on',
            off: 'Refund emails are turned off'
        },
        emailCollectionMode: {
            updated: emailCollectionMode => `Email address collection is set to ${emailCollectionMode}`
        },
        customParagraph: {
            updated: 'Payment confirmation email template updated'
        }
    },
    feedback: {
        submitted: 'Thanks for your feedback'
    },
    paymentLinks: {
        paymentLinkUpdated: 'Your payment link has been updated',
        deleted: 'The payment link was successfully deleted',
        titleAndDetailsUpdated: 'The details have been updated',
        referenceUpdated: 'The details have been updated'
    }
}