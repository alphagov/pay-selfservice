'use strict'

// private Long id;
//     private String gatewayPayoutId;
//     private Long amount;
//     @JsonIgnore
//     private ZonedDateTime createdDate;
//     @JsonSerialize(using = MicrosecondPrecisionDateTimeSerializer.class)
//     @JsonDeserialize(using = MicrosecondPrecisionDateTimeDeserializer.class)
//     private ZonedDateTime paidOutDate;
//     private PayoutState state;
//     private Integer eventCount;
//     private String payoutDetails;

// Local dependencies
const pactBase = require('./pact_base')

// Global setup
const pactPayout = pactBase()

const payout = {
  gateway_payout_id: '11111',
  amount: 1000.00,
  createdDate: '01 Jan 2020 - 10:00',
  paidOutDate: '02 Jan 2020 - 10:00',
  state: 'success',
  eventCount: 1,
  payoutDetails: 'Council Tax'
}

module.export = {
  validPayoutResponse: () => {
    return {
      getPactified: () => {
        return pactPayout.pactify(payout)
      },
      getPlain: () => {
        return payout
      }
    }
  }
}
