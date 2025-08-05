module.exports = {
  apps: [
    {
      name: "chain-api", // ชื่อแอป
      script: "./index.js", // ไฟล์เริ่มต้นของแอป
      instances: "max", // ใช้จำนวน core ของ CPU
      exec_mode: "cluster", // ใช้โหมดคลัสเตอร์
      watch: true, // เปิด Watch Mode
      env: {
        NODE_ENV: "development", // สภาพแวดล้อมการพัฒนา
        PORT: 9999,
        MONGO_URI:
          "mongodb+srv://tossagun:1j60G3u5v4mJZ27h@db-nbadigitalservice-c204ed06.mongo.ondigitalocean.com/CHAIN?authSource=admin&replicaSet=db-nbadigitalservice&tls=true",
        env: {
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        },
        AWS_REGION: "ap-southeast-2",
        AWS_BUCKET_NAME: "tossagunHotel",
        SALT: 12,
        JWT_SECRET: "chain&sec$platform",
        FRONTEND_URL: "http://206.189.84.112",
      },
      env_production: {
        NODE_ENV: "production", // สภาพแวดล้อมใน Production
        PORT: 8080, // พอร์ตใน production
        MONGO_URI:
          "mongodb+srv://tossagun:1j60G3u5v4mJZ27h@db-nbadigitalservice-c204ed06.mongo.ondigitalocean.com/CHAIN?authSource=admin&replicaSet=db-nbadigitalservice&tls=true",
        env: {
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
        },
        AWS_REGION: "ap-southeast-2",
        AWS_BUCKET_NAME: "tossagunHotel",
        SALT: 12,
        JWT_SECRET: "chain&sec$platform",
        FRONTEND_URL: "http://206.189.84.112",
      },
    },
  ],

  deploy: {
    production: {
      user: "SSH_USERNAME", // ชื่อผู้ใช้ SSH
      host: "SSH_HOSTMACHINE", // IP หรือ hostname ของเซิร์ฟเวอร์
      ref: "origin/master", // branch ที่ใช้ deploy
      repo: "GIT_REPOSITORY", // URL ของ Git repository
      path: "DESTINATION_PATH", // ตำแหน่งที่ต้องการ deploy บนเซิร์ฟเวอร์
      "pre-deploy-local": "", // คำสั่งก่อน deploy (local)
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.js --env production", // คำสั่งหลัง deploy
      "pre-setup": "", // คำสั่งก่อน setup
    },
  },
};
