/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    function (record, search) {
        const CAT_COMPANY = '6'
        let AVATAX = '1295'
        let NO_REPORT = '1293'
        const FIELD = {
            TAXABLE: 'taxable',
            AVA_CERTIFICATE: 'custpage_ava_exemption',
            CATEGORY: 'category',
            TAX_ITEM: 'taxitem',
            SUBLIST_ADDRESS: 'addressbook',
            ADDRESS: 'defaultaddress'
        }

        function pageInit(scriptContext) {
            console.log('pageInit');
        }

        function fieldChanged(scriptContext) {
                try {
                    var objCurrentRecord = scriptContext.currentRecord;
                    var strFieldChanging = scriptContext.fieldId;
                    console.log('strFieldChanging', strFieldChanging);
                    if (strFieldChanging === FIELD.CATEGORY || strFieldChanging === FIELD.AVA_CERTIFICATE) {
                        updateFinancialTab(objCurrentRecord);
                    }
                } catch (err) {
                    console.log('ERROR fieldChanged', err)
                }
        }

        function sublistChanged(scriptContext) {
            var objCurrentRecord = scriptContext.currentRecord;
            var strSublistChanging = scriptContext.sublistId;
            console.log('sublistChanged', strSublistChanging);
            if (strSublistChanging === FIELD.SUBLIST_ADDRESS){
                updateFinancialTab(objCurrentRecord);
            }
        }

        function updateFinancialTab(objCurrentRecord) {
                var strCertificate = objCurrentRecord.getValue({
                    fieldId: FIELD.AVA_CERTIFICATE
                });
                var strCategory = objCurrentRecord.getValue({
                    fieldId: FIELD.CATEGORY
                });
                var bolState = getState(objCurrentRecord)

                console.log("updateFinancialTab: strCertificate: ", strCertificate);
                console.log("updateFinancialTab: strCategory: ", strCategory);
                console.log("updateFinancialTab: bolState: ", bolState);
                var blnTaxValue

                if (bolState) {
                    if (strCertificate) {
                        blnTaxValue = false
                    } else {
                        blnTaxValue = true
                    }
                    objCurrentRecord.setValue({
                        fieldId: FIELD.TAXABLE,
                        value: blnTaxValue,
                    });
                    objCurrentRecord.setValue({
                        fieldId: FIELD.TAX_ITEM,
                        value: AVATAX,
                    });
                } else {
                    objCurrentRecord.setValue({
                        fieldId: FIELD.TAXABLE,
                        value: false,
                    });
                    objCurrentRecord.setValue({
                        fieldId: FIELD.TAX_ITEM,
                        value: AVATAX,
                    });
                }

                if (strCategory === CAT_COMPANY) {
                    objCurrentRecord.setValue({
                        fieldId: FIELD.TAXABLE,
                        value: false,
                    });
                    objCurrentRecord.setValue({
                        fieldId: FIELD.TAX_ITEM,
                        value: NO_REPORT,
                    });
                }
        }
        function getState(objCurrentRecord) {
            var blnState = false
            var numLines = objCurrentRecord.getLineCount({
                sublistId: 'addressbook'
            });
            if (numLines) {
                objCurrentRecord.selectLine({
                    sublistId: 'addressbook',
                    line: 0
                });
                let addressbookaddress_text = objCurrentRecord.getCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress_text',
                    line: 0
                });
                if (addressbookaddress_text){
                    const arrAddress = addressbookaddress_text.split(',');
                    var rawState = arrAddress[1];
                    console.log("rawState", rawState);
                    if (rawState.includes("NC") || rawState.includes("WA") || rawState.includes("CA")) {
                        console.log("getState", true);
                        blnState = true
                    } else {
                        console.log("getState", false);
                        blnState = false
                    }
                }

            }
            return blnState
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            sublistChanged: sublistChanged,
        };

    })
;
