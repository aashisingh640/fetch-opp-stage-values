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
async function makeConnection() {
    try {
        
        const connection = new jsforce.Connection({});
        await connection.login(process.env.USERNAME, process.env.PASSWORD);
        return connection;

    } catch (error) {
        console.log('error in makeConnection - ', error);
        throw error;
    }
}

/**
 * fetch metadata of the sobject passed (including fields)
 * @param {string} sobject - Opportunity
 * @returns {object} metadata
 */
async function getMetadata(sobject, connection) {
    try {
        
        const meta = await connection.sobject(sobject).describe();
        return meta;

    } catch (error) {
        console.log('error in getMetadata - ', error);
        throw error;
    }
}

/**
 * generates a map between the Record Type and the picklist values assigned to the Record Type
 * @param {object} connection jsforce connection to the org
 * @param {Array} recordTypes contains the record type values of the sobject
 * @returns {Object} stageNames
 */
async function generateStageNameMap(connection, recordTypes) {
    try {

        const stageNames = {};
        const promises = [];

        recordTypes.forEach(async type => promises.push(fetchRecordTypeLayouts(connection, type.urls.layout, type.recordTypeId)));

        const results = await Promise.all(promises);
        results.forEach(res => stageNames[res.id] = res.values);

        return stageNames;

    } catch (error) {
        console.log('error in generateStageNameMap - ', error);
        throw error;
    }
}

/**
 * fetch the layout of the record type of opportunity
 * @param {object} connection jsforce connection to the org
 * @param {string} url of the record type
 * @param {string} id of the record type
 * @returns {object} id and picklist values
 */
async function fetchRecordTypeLayouts(connection, url, id) {
    try {

        const request = {
            body: "",
            header: { "Content-Type": "application/json" },
            method: "get",
            url
        };

        const response = await connection.request(request);
        const stageNames = findObjects(response, 'name', 'StageName');
        return { id, values: stageNames[0]["picklistValues"] };

    } catch (error) {
        console.log('error in fetchRecordTypeLayouts - ', error);
        throw error;
    }
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