/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    (record, search) => {
        const STATES = ['CA', 'NC', 'WA']
        const CAT_COMPANY = '6'
        let AVATAX = '1295'
        let NO_REPORT = '1293'

        const FIELD = {
            TAXABLE: 'taxable',
            AVA_CERTIFICATE: 'custentity_ava_exemptcertno',
            CATEGORY: 'category',
            TAX_ITEM: 'taxitem'
        }

        const SEARCH = {
            TYPE: 'customer',
            INTERNAL_ID: 'internalid',
            DEFAULT_SHIPPING: 'isdefaultshipping',
            TRUE: 'T',
            STATE: 'state',
            SHIP_ADDRESS: 'shippingAddress'
        }

        const afterSubmit = (scriptContext) => {
            try {
                let taxableValue;
                let objRecord = scriptContext.newRecord
                let strRecordId = objRecord.id
                let strRecordType = objRecord.type
                log.debug('strRecordId', strRecordId)
                if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                    let strCertificate = objRecord.getValue({
                        fieldId: FIELD.AVA_CERTIFICATE
                    })
                    let strCategory = objRecord.getValue({
                        fieldId: FIELD.CATEGORY
                    })
                    let bolState = searchState(strRecordId)

                    log.debug('strCategory', strCategory)
                    log.debug('strCertificate', strCertificate)
                    log.debug('bolState', bolState)

                    if (bolState) {
                        if (strCertificate) {
                            taxableValue = false
                        } else {
                            taxableValue = true
                        }
                        record.submitFields({
                            type: strRecordType,
                            id: strRecordId,
                            values: {
                                [FIELD.TAXABLE]: taxableValue
                            }
                        });
                    } else {
                        record.submitFields({
                            type: strRecordType,
                            id: strRecordId,
                            values: {
                                [FIELD.TAXABLE]: false,
                                [FIELD.TAX_ITEM]: AVATAX
                            }
                        });
                    }

                    if (strCategory === CAT_COMPANY) {
                        record.submitFields({
                            type: strRecordType,
                            id: strRecordId,
                            values: {
                                [FIELD.TAX_ITEM]: NO_REPORT,
                                [FIELD.TAXABLE]: false
                            }
                        })
                    }
                }
                // if (scriptContext.type === scriptContext.UserEventType.EDIT) {
                //     let blnTaxable = objRecord.getValue({
                //         fieldId: FIELD.TAXABLE
                //     })
                //     let intTaxItem = objRecord.getValue({
                //         fieldId: FIELD.TAX_ITEM
                //     })
                //     log.debug('MANUAL EDIT: TAXABLE', blnTaxable)
                //     log.debug('MANUAL EDIT: TAX_ITEM', intTaxItem)
                //     record.submitFields({
                //         type: strRecordType,
                //         id: strRecordId,
                //         values: {
                //             [FIELD.TAXABLE]: blnTaxable,
                //             [FIELD.TAX_ITEM]: intTaxItem
                //         }
                //     });
                // }
            } catch (err) {
                log.error('ERROR afterSubmit', err)
            }
        }

        //This function searches for the state and returns true or false depending on the condition
        const searchState = (strRecordId) => {
            let strState
            let objSearch = search.create({
                type: SEARCH.TYPE,
                filters: [
                    search.createFilter({
                        name: SEARCH.INTERNAL_ID,
                        operator: search.Operator.ANYOF,
                        values: strRecordId
                    }),
                    search.createFilter({
                        name: SEARCH.DEFAULT_SHIPPING,
                        operator: search.Operator.IS,
                        values: SEARCH.TRUE
                    })
                ],
                columns: [
                    search.createColumn({name: SEARCH.STATE, join: SEARCH.SHIP_ADDRESS})
                ]
            })

            objSearch.run().each(function (result) {
                strState = result.getValue({
                    name: SEARCH.STATE,
                    join: SEARCH.SHIP_ADDRESS
                })
            })
            log.debug("strState", strState)
            return STATES.includes(strState)
        }

        return {afterSubmit}
    });
