const T = require("twit")
const fs = require("fs")
const { createCanvas, loadImage} = require('canvas')
const puppeteer = require("puppeteer")
require("dotenv").config()

const twit = new T({
    consumer_key: process.env.API_KEY,
    consumer_secret: process.env.API_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    timeout_ms: 60*1000
  });

const keyWord       =   "batman drogado"
const wrongWord     =   "Bateu, man"
const fontsize      =    70 //70 padrão
const status        =    wrongWord+" "+"#Batman #DC #Meme"
let autoPost      =    false

autoPost = true


const imageName = keyWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

async function mememaker(){

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://images.google.com/');

    //achar o input e fazer a busca
    await page.waitForSelector("input")
    await page.type("input",keyWord)
    await page.click("button[type=submit]")
    await page.waitForTimeout(2000)

    //Clicar na miniatura da imagem e obter o source da imagem original
    await page.waitForSelector("a.wXeWr")
    await page.click("a.wXeWr")
    await page.waitForTimeout(2000)
    var url = await page.evaluate(()=> document.querySelectorAll("div.bRMDJf img")[0].getAttribute("src"))
    console.log(url)

    //iniciando um canvas
    const width = 800
    const height = 800

    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')

    context.fillStyle = '#000'
    context.fillRect(0, 0, width, height)

    
    const image = await loadImage(url)

    //Draw image fitting with he canvas
    var scale = Math.max(canvas.width / image.width, canvas.height / image.height);
    var x = (canvas.width / 2) - (image.width / 2) * scale;
    var y = (canvas.height / 2) - (image.height / 2) * scale;

    console.log(image)
    context.drawImage(image, x, y, image.width * scale, image.height * scale)

    const text = wrongWord
    context.font = 'bold '+fontsize+'pt Arial'
    context.textAlign = 'center'
    context.fillStyle = '#fff'
    context.strokeStyle = 'black'
    context.lineJoin = "round"
    context.lineWidth = 16
    context.strokeText(text, 400, 700)
    context.fillText(text, 400, 700)

    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync("images/"+imageName+".png", buffer)

    await browser.close();

    if(autoPost){
        memepost()
    }

}

function memepost (){
    
    var b64content = fs.readFileSync('images/'+imageName+'.png', { encoding: 'base64' })
    
    twit.post('media/upload', { media_data: b64content }, function (err, data, response) {

    var mediaIdStr = data.media_id_string
    var altText = "Imagem de "+keyWord+", com a seguinte legenda: "+wrongWord
    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

    twit.post('media/metadata/create', meta_params, function (err, data, response) {
    if (!err) {
        var params = { status: status, media_ids: [mediaIdStr] }

        twit.post('statuses/update', params, function (err, data, response) {
        console.log(data)
        })
    }
    })
    })
}

mememaker()