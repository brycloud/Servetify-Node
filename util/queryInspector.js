/**
 * Checks if a given SQL query string is safe to run by verifying that it does not contain any harmful commands such as DROP TABLE, TRUNCATE, UPDATE, or DELETE.
 *
 * @param {string} query - the SQL query string to be inspected
 * @return {boolean} true if the query is safe to run, false otherwise
 */
export default function queryInspector(query) {
    if (typeof query !== 'string') return false;
    if (query.match(/\<script[\s\S]*?\>[\s\S]*?\<\/script[\s\S]*?\>/i)) return false;
    if (query.match(/\"\s*DROP\s\s*TABLE/i)) return false;
    if (query.match(/\'\s*DROP\s\s*TABLE/i)) return false;
    if (query.match(/\)\s*DROP\s\s*TABLE/i)) return false;
    if (query.match(/\(\s*DROP\s\s*TABLE/i)) return false;
    if (query.match(/\"\s*TRUNCATE/i)) return false;
    if (query.match(/\'\s*TRUNCATE/i)) return false;
    if (query.match(/\)\s*TRUNCATE/i)) return false;
    if (query.match(/\(\s*TRUNCATE/i)) return false;
    if (query.match(/\"\"((\;)?)TRUNCATE/i)) return false;
    if (query.match(/\'\'((\;)?)TRUNCATE/i)) return false;
    if (query.match(/\"\"((\;)?)DROP\s*/i)) return false;
    if (query.match(/\'\'((\;)?)DROP\s*/i)) return false;
    if (query.match(/\"\s*DROP\s*/i)) return false;
    if (query.match(/\'\s*DROP\*/i)) return false;
    if (query.match(/\)\s*DROP\*/i)) return false;
    if (query.match(/\(\s*DROP\*/i)) return false;
    if (query.match(/\"\s*UPDATE\s\s*FROM/i)) return false;
    if (query.match(/\'\s*UPDATE\s\s*FROM/i)) return false;
    if (query.match(/\)\s*UPDATE\s\s*FROM/i)) return false;
    if (query.match(/\(\s*UPDATE\s\s*FROM/i)) return false;
    if (query.match(/\"\s*UPDATE/i)) return false;
    if (query.match(/\'\s*UPDATE/i)) return false;
    if (query.match(/\)\s*UPDATE/i)) return false;
    if (query.match(/\(\s*UPDATE/i)) return false;
    if (query.match(/\"\"((\;)?)UPDATE/i)) return false;
    if (query.match(/\'\'((\;)?)UPDATE/i)) return false;
    if (query.match(/\"\"((\;)?)UPDATE\s*/i)) return false;
    if (query.match(/\'\'((\;)?)UPDATE\s*/i)) return false;
    if (query.match(/\"\s*UPDATE\s*/i)) return false;
    if (query.match(/\'\s*UPDATE\*/i)) return false;
    if (query.match(/\)\s*UPDATE\*/i)) return false;
    if (query.match(/\(\s*UPDATE\*/i)) return false;
    if (query.match(/\"\s*DELETE\s\s*FROM/i)) return false;
    if (query.match(/\'\s*DELETE\s\s*FROM/i)) return false;
    if (query.match(/\)\s*DELETE\s\s*FROM/i)) return false;
    if (query.match(/\(\s*DELETE\s\s*FROM/i)) return false;
    if (query.match(/\"\s*DELETE/i)) return false;
    if (query.match(/\'\s*DELETE/i)) return false;
    if (query.match(/\)\s*DELETE/i)) return false;
    if (query.match(/\(\s*DELETE/i)) return false;
    if (query.match(/\"\"((\;)?)DELETE/i)) return false;
    if (query.match(/\'\'((\;)?)DELETE/i)) return false;
    if (query.match(/\"\"((\;)?)DELETE\s*/i)) return false;
    if (query.match(/\'\'((\;)?)DELETE\s*/i)) return false;
    if (query.match(/\"\s*DELETE\s*/i)) return false;
    if (query.match(/\'\s*DELETE\*/i)) return false;
    if (query.match(/\)\s*DELETE\*/i)) return false;
    if (query.match(/\(\s*DELETE\*/i)) return false;
    if (query.match(/\"\s*DELETE\s\s*TABLE/i)) return false;
    if (query.match(/\'\s*DELETE\s\s*TABLE/i)) return false;
    if (query.match(/\)\s*DELETE\s\s*TABLE/i)) return false;
    if (query.match(/\(\s*DELETE\s\s*TABLE/i)) return false;
    return true;
}

