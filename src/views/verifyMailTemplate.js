exports.verifyMailTemplate = (verifyUrl) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
            <title>${process.env.APP_NAME}</title>
            <style>
              body{
                font-family: 'Lato', sans-serif;
              }
              table {
                border-spacing: 0;
              }
              td {
                padding: 0;
              }
              img {
                border: 0;
              }
            </style>
          </head>
          <body style="padding: 40px 0; background-color: #f0f8ffe1">
            <div
              style="
                background-color: #ffffff;
                margin: 40px auto;
                width: 100%;
                border-spacing: 0;
                max-width: 600px;
                padding: 80px 0;
              "
            >
              <div
                style="
                  width: 100%;
                  border-radius: 10px;
                  background-color: #ffffff;
                  margin: 0 auto;
                  display: grid;
                  justify-content: center;
                  align-items: center;
                "
              >
                <img
                  style="width: 200px; margin: 0 auto"
                  src="https://res.cloudinary.com/dxodgllun/image/upload/v1685442588/ayykori_logo/mainlogo1_r2iasn.png"
                  alt=""
                />
                <h1
                  style="
                    font-size: 20px;
                    color: #6d6d6d;
                    text-align: center;
                    font-weight: 500;
                    margin-bottom: -4px;
                    
                  "
                >
                  One step to go..
                </h1>
                <div
                  style="
                    width: 100%;
                    margin: 0 auto;
                    display: grid;
                    justify-content: center;
                    align-items: center;
                  "
                >
                  <h4
                    style="
                      font-size: 14px;
                      color: #858585;
                      font-weight: 400;
                      text-align: center;
                      
                    "
                  >
                    Click the button below to verify.
                  </h4>
                  <div style="width: 100%; position: relative; margin: 20px 0">
                    <a
                      href=${verifyUrl}
                      target="_blank"
                      style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        display: block;
                        margin: 0 auto;
                        width: 200px;
                        padding: 12px 6px;
                        color: #ffffff;
                        background-color: #0ac9c9;
                        text-decoration: none;
                        text-align: center;
                        
                      "
                      >Verify</a
                    >
                  </div>
                </div>
                <h5
                  style="
                    font-size: 14px;
                    color: #858585;
                    font-weight: 400;
                    text-align: center;
                    
                  "
                >
                  Didn’t request this? You can ignore this email and get back to
        
                  <a href="${process.env.CLIENT_URL}" target="_blank">${process.env.APP_NAME}</a> as usual.
                </h5>
                <h5
                style="
                  font-size: 12px;
                  color: #64a1e7;
                  font-weight: 400;
                  text-align: center;
                  
                "
              >
               NB: If you got this mail as spam then click on "looks safe" or "Report not spam".
              </h5>
              </td>
            </table>
          </body>
        </html>  
      `;
};
