const sql = require('mssql')
const formidable = require('koa-formidable'); // 图片处理
const fs = require('fs'); // 图片路径
const path = require('path'); // 图片路径
let uploadDir = './images/';

const getWareHousingList = async (ctx, next) => {
    const body = ctx.request.body;
    let totalSql = `SELECT COUNT(R.spid) AS TOTAL FROM jh_rkmx R LEFT JOIN jh_rkhz H ON R.djbh = H.djbh LEFT JOIN spkfk S ON R.spid = S.spid 
    LEFT JOIN yaojiandayin Y ON R.spid = Y.spid AND R.pihao = Y.pihao LEFT JOIN mchk M ON H.dwbh = M.dwbh WHERE 1 = 1 `;
    let startTestSql = `SELECT * from (
        SELECT ROW_NUMBER() OVER(ORDER BY H.rq desc,R.djbh,H.dwbh, S.spbh) as px, R.djbh, R.spid, R.pihao, R.dw, H.dwbh, S.pizhwh, S.spmch, 
        S.spbh, S.shpgg, S.shpchd, M.dwmch, M.danwbh, H.rq, Y.img FROM jh_rkmx R LEFT JOIN jh_rkhz H ON R.djbh = H.djbh  LEFT JOIN spkfk S ON 
        R.spid = S.spid LEFT JOIN yaojiandayin Y ON R.spid = Y.spid AND R.pihao = Y.pihao LEFT JOIN mchk M ON H.dwbh = M.dwbh WHERE 1 = 1 `

    let searchSqlList = [];
    if (body.searchVal.djbh.val) {
        searchSqlList.push(`AND R.djbh LIKE '%${body.searchVal.djbh.val}%'`);
    }
    if (body.searchVal.spbh.val) {
        searchSqlList.push(` AND (S.spbh LIKE '%${body.searchVal.spbh.val}%' OR S.spmch LIKE '%${body.searchVal.spbh.val}%' OR S.zjm LIKE '%${body.searchVal.spbh.val}%' ) `);
    }
    if (body.searchVal.dwmc.val) {
        searchSqlList.push(` AND (M.dwmch LIKE '%${body.searchVal.dwmc.val}%' OR M.zjm LIKE '%${body.searchVal.dwmc.val}%' ) `);
    }

   
    if (body.searchVal.pihao.val) {
        searchSqlList.push(` AND R.pihao LIKE '%${body.searchVal.pihao.val}%'`);
    }
    if (body.searchVal.time.val[0] !== 'Invalid date' && Boolean(body.searchVal.time.val[0])) {
        searchSqlList.push(` AND H.rq >= '${body.searchVal.time.val[0]}' and H.rq <= '${body.searchVal.time.val[1]}'`);
    }
    if (body.searchVal.updateTime.val[0] !== 'Invalid date' && Boolean(body.searchVal.updateTime.val[0])) {
        searchSqlList.push(` AND Y.time >= '${body.searchVal.updateTime.val[0]} 00:00:00.000' and Y.time <= '${body.searchVal.updateTime.val[1]} 23:59:59.000'`);
    }
    if (body.searchVal.status.val === 1) {
        searchSqlList.push(` AND R.spid = Y.spid AND  ISNULL(datalength (Y.img),0) > 0 `);
    }
    if (body.searchVal.status.val === 0) {
        searchSqlList.push(` AND R.spid <>ALL(select spid from yaojiandayin WHERE  ISNULL(datalength (img),0) > 0 ) `);
    }
    totalSql += searchSqlList.join(' ')
    startTestSql += ` ${searchSqlList.join(' ')})  as t2 where t2.px between ${(body.pageIndex - 1) * body.pageSize + 1} and ${body.pageIndex * body.pageSize}`
    let result = await sql.query(startTestSql);
    let total = await sql.query(totalSql);
    ctx.body = { total: total.recordset[0].TOTAL, result: result.recordset };
}

// 新建文件，可以去百度fs模块
let mkdirs = (dirname, callback) => {
    fs.exists(dirname, function (exists) {
        if (exists) {
            callback();
        } else {
            mkdirs(path.dirname(dirname), function () {
                fs.mkdir(dirname, callback);
            });
        }
    });
};



const insertDrugPic = async (ctx, next) => {
    const body = ctx.request.files;
    const data = JSON.parse(ctx.request.body.uploadPicData);
    let removeImg = [];
    if (ctx.request.body.removeImg) {
        removeImg = JSON.parse(ctx.request.body.removeImg);
    }
    let img = [];
    Array.prototype.remove = function (removeVal) {
        let index = this.indexOf(removeVal);
        if (index > -1) {
            this.splice(index, 1);
        }
    }
    let imgSql = `SELECT img FROM yaojiandayin WHERE spid = '${data.spid}' AND pihao = '${data.pihao}'`;
    let imgResult = await sql.query(imgSql);
    if (imgResult.recordset[0] && imgResult.recordset[0].img) {
        img = imgResult.recordset[0].img.split(',');
    }

    if (removeImg.length !== 0) {
        removeImg.forEach(item => {
            img.remove(item);
            let picName = item.slice(item.lastIndexOf("\/") + 1, item.length);
            fs.unlink(uploadDir + picName, () => {
            })
        });
    }
    let imgList = [...img];
    if (body.index) {
        if (!(body.index instanceof Array)) {
            body.index = [body.index];
        }
        body.index.forEach((item, ind) => {
            let fileName = item.name;
            let newFileName = Date.now() + '_' + fileName;
            let readStream = fs.createReadStream(item.path);
            let writeStream = fs.createWriteStream(uploadDir + newFileName);
            readStream.pipe(writeStream);
            imgList.push(`http://www.img.com/${newFileName}`);
        });
    }
    let imgPath = imgList.join(',');
    let jugdeSql = `SELECT * FROM yaojiandayin WHERE spid = '${data.spid}' AND pihao = '${data.pihao}'`;
    let isExist = await sql.query(jugdeSql);
    let insertSql = `INSERT INTO yaojiandayin (spid, time, img, pihao) SELECT '${data.spid}','${data.time}','${imgPath}','${data.pihao}'`;
    let updateSql = `UPDATE yaojiandayin SET time= '${data.time}',img= '${imgPath}' WHERE spid = '${data.spid}' AND pihao = '${data.pihao}'`;
    let result = ''
    if (isExist.rowsAffected[0] === 0) {
        result = await sql.query(insertSql, body);
    } else {
        result = await sql.query(updateSql);
    }
    let isSuccess = result.rowsAffected[0] === 0 ? false : true;
    ctx.body = { success: isSuccess };
}




module.exports = {
    'POST /getWareHousingList': getWareHousingList,
    'POST /insertDrugPic': insertDrugPic
}