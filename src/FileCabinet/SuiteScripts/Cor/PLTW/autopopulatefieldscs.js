/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/currentRecord'],
/**
 * @param{record} record
 * @param{search} search
 * @param{currentRecord} currentRecord
 */
function(record, search, currentRecord) {
    const CAT_COMPANY = '6'
    const AVATAX = '1295'
    const NO_REPORT = '1293'
    const FIELD = {
        TAXABLE: 'taxable',
        AVA_CERTIFICATE: 'custpage_ava_exemption',
        CATEGORY: 'category',
        TAX_ITEM: 'taxitem',
        SUBLIST_ADDRESS: 'addressbook',
        ADDRESS: 'addressbookaddress_text',
        ENTITY_CODE: 'custpage_ava_entityusecode'
    }

    function pageInit(scriptContext) {
        console.log('pageInit: Auto populate Tax and Entity Code');
    }

    function fieldChanged(scriptContext) {
        try {
            var currentRecord = scriptContext.currentRecord;
            var strFieldChanging = scriptContext.fieldId;
            console.log('strFieldChanging', strFieldChanging);

            if (strFieldChanging === FIELD.CATEGORY) {
                updateTax(currentRecord);
                updateEntityUseCode(currentRecord);
            }
            if (strFieldChanging === FIELD.AVA_CERTIFICATE) {
                updateTax(currentRecord);
                updateEntityUseCode(currentRecord);
            }
            if (strFieldChanging === FIELD.ADDRESS){
                updateTax(currentRecord);
                updateEntityCodeField(currentRecord);
            }
            if (strFieldChanging === FIELD.ENTITY_CODE){
                updateEntityCodeField(currentRecord);
            }
        } catch (err) {
            console.log('ERROR fieldChanged', err)
        }
    }

    function updateEntityUseCode(currentRecord) {
        var strCertificate = currentRecord.getValue({
            fieldId: FIELD.AVA_CERTIFICATE
        });
        var numLines = currentRecord.getLineCount({
            sublistId: 'addressbook'
        });
        if (numLines > 0) {
            console.log("numLines: ", numLines);
            for (var x = 0; x < numLines; x++) {
                console.log("x: ", x);
                currentRecord.selectLine({
                    sublistId: 'addressbook',
                    line: x
                });

                let strAddrbook = currentRecord.getCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress_text',
                });

                console.log("strAddrbook", strAddrbook)

                var bolState = getState(strAddrbook)

                if (bolState){
                    if (!strCertificate){
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'addressbook',
                            fieldId: 'custpage_ava_entityusecode',
                            value: 18, // TAXABLE
                        });
                    } else {
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'addressbook',
                            fieldId: 'custpage_ava_entityusecode',
                            value: '',
                        });
                    }
                } else {
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'addressbook',
                        fieldId: 'custpage_ava_entityusecode',
                        value: '',
                    });
                }

                currentRecord.commitLine({
                    sublistId: 'addressbook'
                });
                updateEntityCodeField(currentRecord)
            }
        }
    }

    function updateEntityCodeField(currentRecord){

        let entityUseCode = currentRecord.getCurrentSublistValue({
            sublistId: 'addressbook',
            fieldId: 'custpage_ava_entityusecode',
        });

        currentRecord.setValue({
            fieldId: 'custentity_useentitycodes',
            value: entityUseCode
        });

        console.log("updateEntityCodeField", entityUseCode)
    }

    function updateTax(currentRecord) {
        var strCertificate = currentRecord.getValue({
            fieldId: FIELD.AVA_CERTIFICATE
        });
        var strCategory = currentRecord.getValue({
            fieldId: FIELD.CATEGORY
        });
        let strAddrbook = currentRecord.getCurrentSublistValue({
            sublistId: 'addressbook',
            fieldId: 'addressbookaddress_text',
        });
        var bolState = getState(strAddrbook)
        console.log("updateFinancialTab: strCertificate: ", strCertificate);
        console.log("updateFinancialTab: strCategory: ", strCategory);
        console.log("updateFinancialTab: bolState: ", bolState);
        if (bolState) {
            var blnTaxValue = false
            var intEntityCode = ""
            if (strCertificate) {
                blnTaxValue = false
                intEntityCode = ''
            } else {
                blnTaxValue = true
                intEntityCode = 18 // TAXABLE

            }
            currentRecord.setCurrentSublistValue({
                sublistId: 'addressbook',
                fieldId: FIELD.ENTITY_CODE,
                value: intEntityCode,
            });
            currentRecord.setValue({
                fieldId: FIELD.TAXABLE,
                value: blnTaxValue,
            });
            currentRecord.setValue({
                fieldId: FIELD.TAX_ITEM,
                value: AVATAX,
            });
        } else {
            currentRecord.setValue({
                fieldId: FIELD.TAXABLE,
                value: false,
            });
            currentRecord.setValue({
                fieldId: FIELD.TAX_ITEM,
                value: AVATAX,
            });
            currentRecord.setCurrentSublistValue({
                sublistId: 'addressbook',
                fieldId: FIELD.ENTITY_CODE,
                value: ''
            });
        }

        if (strCategory === CAT_COMPANY) {
            currentRecord.setValue({
                fieldId: FIELD.TAXABLE,
                value: false,
            });
            currentRecord.setValue({
                fieldId: FIELD.TAX_ITEM,
                value: NO_REPORT,
            });
            currentRecord.setCurrentSublistValue({
                sublistId: 'addressbook',
                fieldId: FIELD.ENTITY_CODE,
                value: ''
            });
        }
    }

    function getState(strAddrbook) {
             var blnState = false
            if (strAddrbook){
                const arrAddress = strAddrbook.split(',');
                var rawState = arrAddress[1];
                console.log("rawState", rawState);
                if (rawState.includes("NC") || rawState.includes("WA") || rawState.includes("CA")) {
                    blnState = true
                } else {
                    blnState = false
                }
            }
        console.log("getState", blnState);
        return blnState
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
    };
    
});
