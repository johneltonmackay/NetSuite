/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    (record, search) => {
        const allowedCompanies = [
            "Activia Networks Canada Inc.",
            "Stratacache Inc",
            "Stratacache Limited",
            "Scala Asia Pacific",
            "Scala China Sales Corporation",
            "Scala, Inc.",
            "Scala BV",
            "Scala Canada, Inc.",
            "Scala KK",
            "Scala Nordic AS"
        ];

        const afterSubmit = (scriptContext) => {
            try {
                log.debug("scriptContext: ", scriptContext.type);
                var recType = scriptContext.newRecord.type;
                if (recType == "invoice") {
                    let arrInvoiceData = [];
                    let objInvoiceDates = {};
                    var objInvoiceRec = scriptContext.newRecord;
                    var strId = objInvoiceRec.id
                    log.debug("recType: ", recType);
                    var objRecord = record.load({
                        type: record.Type.INVOICE,
                        id: strId,
                        isDynamic: true,
                    });
                    let intSoId = objRecord.getValue({
                        fieldId: 'createdfrom'
                    });
                    let strSubsidId = objRecord.getText({
                        fieldId: 'subsidiary'
                    });
                    log.debug("intSoId: ", intSoId);
                    log.debug("strSubsidId: ", strSubsidId);
                    if (intSoId) {
                        if (allowedCompanies.includes(strSubsidId)) {
                            var numLines = objInvoiceRec.getLineCount({sublistId: 'item'});
                            log.debug("numLines: ", numLines);
                            let rSDate, rEDate
                            for (var i = 0; i < numLines; i++) {
                                rSDate = objInvoiceRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcoladm_rev_rec_start',
                                    line: i
                                });
                                rEDate = objInvoiceRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcoladm_rev_rec_end',
                                    line: i
                                });
                                objInvoiceDates = {
                                    rEDate: rEDate,
                                    rSDate: rSDate,
                                    line: i
                                }
                                if (rSDate && rEDate) {
                                    arrInvoiceData.push(objInvoiceDates)
                                }
                            }
                            log.debug("arrInvoiceData: ", arrInvoiceData);
                            if (arrInvoiceData.length > 0) {

                                let objDataSo = loadSalesOrder(arrInvoiceData, intSoId)

                                if (objDataSo.revArrangementId) {
                                    let revId = loadRevenueArrangement(objDataSo)
                                    log.debug("Invoice: Revenue", revId);
                                }

                            }
                        }
                    }
                } else {
                    log.debug("recType: ", recType);

                    let arrSoData = [];
                    let objSoDates = {};
                    var objSoRec = scriptContext.newRecord;
                    var objSoRecId = scriptContext.newRecord.id;
                    var fieldLookUpSO = search.lookupFields({
                        type: search.Type.TRANSACTION,
                        id: objSoRecId,
                        columns: ['subsidiary']
                    });
                    if (fieldLookUpSO) {
                        let strSubsidId = fieldLookUpSO.subsidiary[0].text
                        log.debug("strSubsidId: ", strSubsidId);
                        if (strSubsidId) {
                            if (allowedCompanies.includes(strSubsidId)) {
                                var lineNumber = objSoRec.findSublistLineWithValue({
                                    sublistId: 'links',
                                    fieldId: 'linkurl',
                                    value: "/app/accounting/transactions/revarrng.nl?whence="
                                });
                                log.debug("lineNumber: ", lineNumber);

                                let revArrangementId = objSoRec.getSublistValue({
                                    sublistId: 'links',
                                    fieldId: 'id',
                                    line: lineNumber
                                })
                                log.debug("revArrangementId: ", revArrangementId);

                                var soNumLines = objSoRec.getLineCount({sublistId: 'item'});
                                log.debug("soNumLines: ", soNumLines);
                                let soRSDate, soREDate
                                for (var i = 0; i < soNumLines; i++) {
                                    soRSDate = objSoRec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcoladm_rev_rec_start',
                                        line: i
                                    });
                                    soREDate = objSoRec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcoladm_rev_rec_end',
                                        line: i
                                    });
                                    objSoDates = {
                                        soREDate: soREDate,
                                        soRSDate: soRSDate,
                                        soline: i
                                    }
                                    if (soRSDate && soREDate) {
                                        arrSoData.push(objSoDates)
                                    }
                                }
                                log.debug("arrSoData: ", arrSoData);

                                let objDataSo = {
                                    arrSoData: arrSoData,
                                    revArrangementId: revArrangementId
                                }
                                if (objDataSo.revArrangementId) {
                                    let revId = loadRevenueArrangement(objDataSo)
                                    log.debug("Sales Order: Revenue", revId);
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                log.debug("afterSubmit error:", e)
            }
        }


        // PRIVATE FUNCTION


        function loadSalesOrder(arrInvoiceData, intSoId) {
            try {
                let arrSoData = [];
                let objSoDates = {};
                var objSalesOrderRec = record.load({
                    type: record.Type.SALES_ORDER,
                    id: intSoId,
                });
                arrInvoiceData.forEach((data, index) => {
                    log.debug("data: ", data);
                    objSalesOrderRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcoladm_rev_rec_start',
                        value: data.rSDate,
                        line: data.line
                    });
                    objSalesOrderRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcoladm_rev_rec_end',
                        value: data.rEDate,
                        line: data.line
                    });
                });
                let salesOrdId = objSalesOrderRec.save()
                log.debug("salesOrdId: updated", salesOrdId);

                var soNumLines = objSalesOrderRec.getLineCount({sublistId: 'item'});
                log.debug("soNumLines: ", soNumLines);
                let soRSDate, soREDate
                for (var i = 0; i < soNumLines; i++) {
                    soRSDate = objSalesOrderRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcoladm_rev_rec_start',
                        line: i
                    });
                    soREDate = objSalesOrderRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcoladm_rev_rec_end',
                        line: i
                    });
                    objSoDates = {
                        soREDate: soREDate,
                        soRSDate: soRSDate,
                        soline: i
                    }
                    if (soRSDate && soREDate) {
                        arrSoData.push(objSoDates)
                    }
                }
                log.debug("arrSoData: ", arrSoData);

                var lineNumber = objSalesOrderRec.findSublistLineWithValue({
                    sublistId: 'links',
                    fieldId: 'linkurl',
                    value: "/app/accounting/transactions/revarrng.nl?whence="
                });
                log.debug("lineNumber: ", lineNumber);

                let revArrangementId = objSalesOrderRec.getSublistValue({
                    sublistId: 'links',
                    fieldId: 'id',
                    line: lineNumber
                })
                log.debug("revArrangementId: ", revArrangementId);

                let objDataSo = {
                    arrSoData: arrSoData,
                    revArrangementId: revArrangementId
                }

                return objDataSo

            } catch (e) {
                log.debug("loadSalesOrder error:", e)
            }
        }

        function loadRevenueArrangement(objDataSo) {
            try {
                var revRecId
                var objRevArrRec = record.load({
                    type: record.Type.REVENUE_ARRANGEMENT,
                    id: objDataSo.revArrangementId,
                });
                if (objDataSo.arrSoData.length > 0) {
                    objDataSo.arrSoData.forEach((data, index) => {
                        log.debug("data: ", data);
                        objRevArrRec.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'revrecstartdate',
                            value: data.soRSDate,
                            line: data.soline
                        });
                        objRevArrRec.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'forecaststartdate',
                            value: data.soRSDate,
                            line: data.soline
                        });
                        objRevArrRec.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'revrecenddate',
                            value: data.soREDate,
                            line: data.soline
                        });
                        objRevArrRec.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'forecastenddate',
                            value: data.soREDate,
                            line: data.soline
                        });
                    });
                    revRecId = objRevArrRec.save()
                }
                return revRecId
            } catch (e) {
                log.debug("loadRevenueArrangement error:", e)
            }
        }

        return {afterSubmit}

    });
