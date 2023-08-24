 /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 || User Event processing on Item Fulfillment records.
 ||
 || Version = 1.0
 ||    Creation Date = Feb-15-2020     Created By  = Centric Consulting LLC (D.Mellen)
 ||    Purpose = Evangelization customization
 ||
 || Version = 1.1
 ||    Changed Date  = Sep-19-2020     Changed By  = Centric Consulting LLC (D.Mellen)
 ||    Purpose = ERP-1049 Remove Shipping Charge condition
 ||
 || Version = 1.2
 ||    Changed Date  = Oct-8-2021     Changed By  = Netsuite ACS (C.A. Delos Santos)
 ||    Purpose = Fixing of Vendor Return Authorization SuiteScript Error, added validation for transaction type to be applied on all transaction types
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
   
    function beforeLoad(context) {

    }

    function beforeSubmit(context) {
        var currRec = context.newRecord;

        var ordId  = currRec.getValue('orderid');
        var numLines = currRec.getLineCount({ sublistId: 'item' });

        // to check the reference transaction type
        var transaction = search.lookupFields({
                         type: search.Type.TRANSACTION,
                         id: ordId,
                         columns: 'type'
                    });

        var transactionType = '';

        // validate transaction types
        if (transaction.type[0].value === 'SalesOrd') {
            var transactionType = 'salesorder';
        } else if (transaction.type[0].value === 'VendAuth') {
            var transactionType = 'vendorreturnauthorization';
        } else if (transaction.type[0].value === 'TrnfrOrd') {
            var transactionType = 'transferorder';
        }

        log.debug('DEBUG','Record Type:  ' + transactionType);
        log.debug('DEBUG','Order ID:  ' + ordId);

        // ---------------------------------------------------
        //  Get Class value for "Evangelization"
        // ---------------------------------------------------
        var classSrch = search.create({
           type: 'classification',
           filters:
               [ ['name','is','Evangelization'] ],
           columns: [ 'internalid' ]
        });

        var classRslt = classSrch.run().getRange({ start: 0, end: 1 });
        var classId = classRslt[0].getValue({ name: 'internalid' });

        if (!classId) {
            // If class is missing, then stop processing ------------
            log.error('ERROR', '**Evangelization class missing**' );
        } else {

            log.debug('DEBUG','Evangelization class ID:  ' + classId);
            // -------------------------------------------
            //  Get Item sublist for this Item Fulfillment 
            // -------------------------------------------
            for (var subX = 0; subX < numLines; subX++) { 

                var ordLine = currRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'orderline',
                    line: subX });

                log.debug('DEBUG','SO Order Line:  ' + ordLine);
                // ----------------------------------------------------
                //  Get Sales Order line that matches Item Fulfill line 
                // ----------------------------------------------------
                var srch = search.create({
                   type: transactionType,
                   filters:
                   [  ['internalid','anyof',ordId], 
                      'AND', 
                      ['line','equalto',ordLine]  ],
                   columns: [ 'amount', 'rate', 'custcol_cc_shippingcharge' ]
                });

                var rslt = srch.run().getRange({ start: 0, end: 1 });
                var amount = rslt[0].getValue({ name: 'amount' });
                var rate = rslt[0].getValue({ name: 'rate' });
                var sChrg = rslt[0].getValue({ name: 'custcol_cc_shippingcharge' });

                log.debug('DEBUG','Order amount:  ' + amount
                      + '  Order rate:  ' + rate
                      + '  Order ship charge:  ' + sChrg
                );

                // --------------------------------------------------------
                //  If Amount and Rate are Null or Zero
                //    then set Class on Item line to Evangelization
                // --------------------------------------------------------
                if ( (!amount || amount == 0) && 
                    // (!sChrg || sChrg == 0) &&   //Removed V1.1
                     (!rate || rate == 0) ) { 
                    log.debug('DEBUG','Set Class on Sublist ' + subX);
                    currRec.setSublistValue({ 
                        sublistId: 'item', 
                        fieldId: 'class',
                        line: subX, 
                        value: classId
                    });
                }

            }
        };  // end of If for classId
    }

    function afterSubmit(context) {

    }

    return {
//        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
//        afterSubmit: afterSubmit
    };
    
});
