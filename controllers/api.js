const jsforce = require('jsforce');

async function getPicklistValues(req, res) {

    try {

        const connection = await makeConnection();
        const metadata = await getMetadata('Opportunity', connection);
        const stageNames = await generateStageNameMap(connection, metadata.recordTypeInfos);
        return res.json({ stageNames });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ "error": msg })
    }

}

/**
 * make connection with the salesforce org
 * @returns {object} jsforce connection to the org
 */
function makeConnection() {
    return new Promise(async (resolve, reject) => {
        try {
            
            const connection = new jsforce.Connection({});
            await connection.login(process.env.USERNAME, process.env.PASSWORD);
            resolve(connection);

        } catch (error) {
            console.log('error in makeConnection - ', error);
            reject(error);
        }
    })
}

/**
 * fetch metadata of the sobject passed (including fields)
 * @param {string} sobject - Opportunity
 * @returns {object} metadata
 */
function getMetadata(sobject, connection) {
    return new Promise(async (resolve, reject) => {
        try {
            
            const meta = await connection.sobject(sobject).describe();
            resolve(meta);

        } catch (error) {
            console.log('error in getMetadata - ', error);
            reject(error);
        }
    })
}

/**
 * generates a map between the Record Type and the picklist values assigned to the Record Type
 * @param {object} connection jsforce connection to the org
 * @param {Array} recordTypes contains the record type values of the sobject
 * @returns {Object} stageNames
 */
function generateStageNameMap(connection, recordTypes) {
    return new Promise(async (resolve, reject) => {
        try {

            const stageNames = {};
            const promises = [];

            recordTypes.forEach(async type => promises.push(fetchRecordTypeLayouts(connection, type.urls.layout, type.recordTypeId)));

            const results = await Promise.all(promises);
            results.forEach(res => stageNames[res.id] = res.values);

            resolve(stageNames);

        } catch (error) {
            console.log('error in generateStageNameMap - ', error);
            reject(error);
        }
    })
}

/**
 * fetch the layout of the record type of opportunity
 * @param {object} connection jsforce connection to the org
 * @param {string} url of the record type
 * @param {string} id of the record type
 * @returns {object} id and picklist values
 */
function fetchRecordTypeLayouts(connection, url, id) {
    return new Promise(async (resolve, reject) => {
        try {

            const request = {
                body: "",
                header: { "Content-Type": "application/json" },
                method: "get",
                url
            };

            const response = await connection.request(request);
            const stageNames = findObjects(response, 'name', 'StageName');
            resolve({ id, values: stageNames[0]["picklistValues"] });

        } catch (error) {
            console.log('error in fetchRecordTypeLayouts - ', error);
            reject(error);
        }
    })
}

/**
 * find out the picklist values of the record type of opportunity
 * @param {object} obj contains the layout of the record type
 * @param {string} targetProp name
 * @param {string} targetValue stageName
 * @returns picklist values of the record type
 */
function findObjects(obj, targetProp, targetValue) {
    const finalResults = [];

    function getObject(theObject) {
        if (theObject instanceof Array) {
            theObject.forEach(item => getObject(item));
        } else {
            for (let prop in theObject) {
                if (theObject.hasOwnProperty(prop)) {
                    prop === targetProp && theObject[prop] === targetValue && finalResults.push(theObject);
                    if (theObject[prop] instanceof Object || theObject[prop] instanceof Array) getObject(theObject[prop]);
                }
            }
        }
    }

    getObject(obj);
    return finalResults;
}

module.exports = { getPicklistValues };