const sql = require('mssql')

const getOutStockList = async (ctx, next) => {
    const body = ctx.request.body;
    let totalSql = `SELECT COUNT(P.spid) AS TOTAL FROM  pf_ckmx P LEFT JOIN spkfk S ON P.spid = S.spid LEFT JOIN yaojiandayin Y ON P.spid = Y.spid AND P.pihao = Y.pihao LEFT JOIN dayinzhuangtai D ON P.djbh = D.djbh AND P.pihao = D.pihao AND P.spid = D.spid  LEFT JOIN pf_ckhz Z ON P.djbh = Z.djbh LEFT JOIN mchk K ON Z.dwbh = K.dwbh WHERE P.djbh LIKE 'XSAZDA%' `
    let startTestSql = `SELECT * from (
        SELECT ROW_NUMBER() OVER(ORDER BY P.rq desc,P.djbh,P.hw, S.spbh ) as px, P.spid, P.djbh, P.pihao, P.dw, P.hw, S.pizhwh, S.spmch, S.spbh, S.shpgg, S.shpchd, P.rq, Y.img , D.status,K.dwmch,K.danwbh FROM pf_ckmx P LEFT JOIN spkfk S ON P.spid = S.spid LEFT JOIN yaojiandayin Y ON P.spid = Y.spid AND P.pihao = Y.pihao LEFT JOIN dayinzhuangtai D ON P.djbh = D.djbh AND P.pihao = D.pihao AND P.spid = D.spid  LEFT JOIN pf_ckhz Z ON P.djbh = Z.djbh LEFT JOIN mchk K ON Z.dwbh = K.dwbh WHERE P.djbh LIKE 'XSAZDA%' `
    let searchSqlList = [];

    if (body.searchVal.djbh.val) {
        searchSqlList.push(`AND P.djbh LIKE '%${body.searchVal.djbh.val}%'`);
    }
    if (body.searchVal.spbh.val) {
        searchSqlList.push(` AND (S.spbh LIKE '%${body.searchVal.spbh.val}%' OR S.spmch LIKE '%${body.searchVal.spbh.val}%' OR S.zjm LIKE '%${body.searchVal.spbh.val}%')`);
    }
  
    if (body.searchVal.pihao.val) {
        searchSqlList.push(` AND P.pihao LIKE '%${body.searchVal.pihao.val}%'`);
    }
    if (body.searchVal.time.val[0] !== 'Invalid date' && Boolean(body.searchVal.time.val[0])) {
        searchSqlList.push(` AND P.rq >= '${body.searchVal.time.val[0]}' and P.rq <= '${body.searchVal.time.val[1]}'`);
    }
    if (body.searchVal.status.val === 1) {
        searchSqlList.push(` AND P.spid = Y.spid `);
    }
    if (body.searchVal.status.val === 0) {
        searchSqlList.push(` AND P.spid <>ALL(select spid from yaojiandayin) `);
    }
    if (body.searchVal.isPrint.val === 1) {
        searchSqlList.push(` AND P.djbh = D.djbh `);
    }
    if (body.searchVal.isPrint.val === 0) {
        searchSqlList.push(` AND P.djbh <>ALL(select djbh from dayinzhuangtai) `);
    }
    totalSql += searchSqlList.join(' ');
    startTestSql += ` ${searchSqlList.join(' ')})  as t2 where t2.px between ${(body.pageIndex - 1) * body.pageSize + 1} and ${body.pageIndex * body.pageSize} `;
    
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