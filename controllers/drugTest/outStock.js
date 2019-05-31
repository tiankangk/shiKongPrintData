const sql = require('mssql')

const getOutStockList = async (ctx, next) => {
    const body = ctx.request.body;
    // let totalSql = `SELECT COUNT(P.spid) AS TOTAL FROM pf_ckmx P LEFT JOIN spkfk S ON P.spid = S.spid LEFT JOIN yaojiandayin Y ON P.spid = Y.spid LEFT JOIN dayinzhuangtai D ON P.spid = D.spid `;
    let totalSql = `SELECT COUNT(P.spid) AS TOTAL FROM  pf_ckmx P LEFT JOIN spkfk S ON P.spid = S.spid LEFT JOIN yaojiandayin Y ON P.spid = Y.spid AND P.pihao = Y.pihao LEFT JOIN dayinzhuangtai D ON P.djbh = D.djbh AND P.pihao = D.pihao AND P.spid = D.spid  LEFT JOIN pf_ckhz Z ON P.djbh = Z.djbh LEFT JOIN mchk K ON Z.dwbh = K.dwbh WHERE P.djbh LIKE 'XSAZDA%' `
    let startTestSql = `SELECT * from (
        SELECT ROW_NUMBER() OVER(ORDER BY P.rq desc,P.djbh,P.hw, S.spbh ) as px, P.spid, P.djbh, P.pihao, P.dw, P.hw, S.pizhwh, S.spmch, S.spbh, S.shpgg, S.shpchd, P.rq, Y.img , D.status,K.dwmch,K.danwbh FROM pf_ckmx P LEFT JOIN spkfk S ON P.spid = S.spid LEFT JOIN yaojiandayin Y ON P.spid = Y.spid AND P.pihao = Y.pihao LEFT JOIN dayinzhuangtai D ON P.djbh = D.djbh AND P.pihao = D.pihao AND P.spid = D.spid  LEFT JOIN pf_ckhz Z ON P.djbh = Z.djbh LEFT JOIN mchk K ON Z.dwbh = K.dwbh WHERE P.djbh LIKE 'XSAZDA%' `
    let endTestSql = `)  as t2 where t2.px between ${(body.pageIndex - 1) * body.pageSize + 1} and ${body.pageIndex * body.pageSize}`
    if (body.searchVal.djbh.val) {
        // startTestSql += `WHERE P.djbh LIKE '%${body.searchVal.djbh.val}%'`;
        // totalSql += `WHERE P.djbh LIKE '%${body.searchVal.djbh.val}%'`;
        startTestSql += `AND P.djbh LIKE '%${body.searchVal.djbh.val}%'`;
        totalSql += `AND P.djbh LIKE '%${body.searchVal.djbh.val}%'`;
    }
    if (body.searchVal.spbh.val) {
        // startTestSql += startTestSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // startTestSql += ` S.spbh LIKE '%${body.searchVal.spbh.val}%'`;
        // totalSql += totalSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // totalSql += ` S.spbh LIKE '%${body.searchVal.spbh.val}%'`;

        startTestSql += ` AND S.spbh LIKE '%${body.searchVal.spbh.val}%'`;
        totalSql += ` AND S.spbh LIKE '%${body.searchVal.spbh.val}%'`;
    }
    if (body.searchVal.zjm.val) {
        // startTestSql += startTestSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // startTestSql += ` S.zjm LIKE '%${body.searchVal.zjm.val}%'`;
        // totalSql += totalSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // totalSql += ` S.zjm LIKE '%${body.searchVal.zjm.val}%'`;
        totalSql += ` AND S.zjm LIKE '%${body.searchVal.zjm.val}%'`;
        startTestSql += ` AND S.zjm LIKE '%${body.searchVal.zjm.val}%'`;
    }
    if (body.searchVal.pihao.val) {
        // startTestSql += startTestSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // startTestSql += ` P.pihao LIKE '%${body.searchVal.pihao.val}%'`;
        // totalSql += totalSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // totalSql += ` P.pihao LIKE '%${body.searchVal.pihao.val}%'`;

        totalSql += ` AND P.pihao LIKE '%${body.searchVal.pihao.val}%'`;
        startTestSql += ` AND P.pihao LIKE '%${body.searchVal.pihao.val}%'`;

    }
    if (body.searchVal.time.val[0] !== 'Invalid date' && Boolean(body.searchVal.time.val[0])) {
        // startTestSql += startTestSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // startTestSql += ` P.rq >= '${body.searchVal.time.val[0]}' and P.rq <= '${body.searchVal.time.val[1]}'`;
        // totalSql += totalSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // totalSql += ` P.rq >= '${body.searchVal.time.val[0]}' and P.rq <= '${body.searchVal.time.val[1]}'`;

        startTestSql += ` AND P.rq >= '${body.searchVal.time.val[0]}' and P.rq <= '${body.searchVal.time.val[1]}'`;
        totalSql += ` AND P.rq >= '${body.searchVal.time.val[0]}' and P.rq <= '${body.searchVal.time.val[1]}'`;
    }
    if (body.searchVal.status.val === 1) {
        // startTestSql += startTestSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // startTestSql += ` P.spid = Y.spid `
        // totalSql += totalSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // totalSql += ` P.spid = Y.spid `;

        startTestSql += ` AND P.spid = Y.spid `
        totalSql += ` AND P.spid = Y.spid `;
    }
    if (body.searchVal.status.val === 0) {
        // startTestSql += startTestSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // startTestSql += ` P.spid <>ALL(select spid from yaojiandayin) `
        // totalSql += totalSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // totalSql += ` P.spid <>ALL(select spid from yaojiandayin) `;

        startTestSql += ` AND P.spid <>ALL(select spid from yaojiandayin) `
        totalSql += ` AND P.spid <>ALL(select spid from yaojiandayin) `;
    }
    if (body.searchVal.isPrint.val === 1) {
        // startTestSql += startTestSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // startTestSql += ` P.djbh = D.djbh `
        // totalSql += totalSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // totalSql += ` P.djbh = D.djbh `;

        startTestSql += ` AND P.djbh = D.djbh `
        totalSql += ` AND P.djbh = D.djbh `;
    }
    if (body.searchVal.isPrint.val === 0) {
        // startTestSql += startTestSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // startTestSql += ` P.djbh <>ALL(select djbh from dayinzhuangtai) `
        // totalSql += totalSql.indexOf('WHERE') === -1 ? 'WHERE' : 'AND';
        // totalSql += ` P.djbh <>ALL(select djbh from dayinzhuangtai) `;

        startTestSql += ` AND P.djbh <>ALL(select djbh from dayinzhuangtai) `
        totalSql += ` AND P.djbh <>ALL(select djbh from dayinzhuangtai) `;
    }
    startTestSql += endTestSql;
    let result = await sql.query(startTestSql);
    let total = await sql.query(totalSql);
    ctx.body = { total: total.recordset[0].TOTAL, result: result.recordset };
}

const updatePrintStatus = async (ctx, next) => {
    const body = ctx.request.body;
    let insertSql = `insert into dayinzhuangtai(djbh, pihao, danwbh, spid, status) `
    body.forEach((item, index) => {
        if (index === body.length - 1) {
            insertSql += `select '${item.djbh}','${item.pihao}','${item.danwbh}','${item.spid}', 1 WHERE NOT EXISTS (SELECT * FROM dayinzhuangtai WHERE djbh = '${item.djbh}' AND pihao = '${item.pihao}' AND danwbh = '${item.danwbh}' AND spid = '${item.spid}')`
        } else {
            insertSql += `select '${item.djbh}','${item.pihao}','${item.danwbh}','${item.spid}', 1 WHERE NOT EXISTS (SELECT * FROM dayinzhuangtai WHERE djbh = '${item.djbh}' AND pihao = '${item.pihao}' AND danwbh = '${item.danwbh}' AND spid = '${item.spid}') union `
        }
    });
    sql.query(insertSql)
    ctx.body = { success: true };
  
}

module.exports = {
    'POST /getOutStockList': getOutStockList,
    'POST /updatePrintStatus': updatePrintStatus
}