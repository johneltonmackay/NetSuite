/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */
 
define(['N/search', 'N/record', 'N/email', 'N/runtime'],
    function(search, record, email, runtime) {
        function execute(context) {

            var searchId1 = runtime.getCurrentScript().getParameter("custscript_empsrc_deactivate");
			log.debug({
					details: 'searchId1(inactive)' + searchId1
				});
				
			
            try {
				// deactivate
                search.load({
				   id: searchId1
                }).run().each(function(result) {
					log.debug({
                        details: 'inactivating employee id: ' + result.id
                    });
					
					
					var id = record.submitFields({
						type: record.Type.EMPLOYEE,
						id: result.id,
						values: {
							isinactive: true
						},
						options: {
							enableSourcing: false,
							ignoreMandatoryFields : true
						}
					});
                   return true;
				});
				
            } catch (e) {
                var subject = 'Fatal Error: Unable to inactivate Employee Id! ' ;
                var authorId = -5;
                var recipientEmail = 'john.mackay@charmedaroma.com';
                email.send({
                    author: authorId,
                    recipients: recipientEmail,
                    subject: subject,
                    body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
                });
            }
        }
        return {
            execute: execute
        };
    });