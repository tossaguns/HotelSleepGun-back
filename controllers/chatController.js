const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const Message = require("../models/Message");

// ตั้งค่า AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// เพิ่มเมธอดสำหรับอัพโหลดไฟล์
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ไม่มีไฟล์ที่อัพโหลด' });
    }

    const folder = 'chat'; // เก็บในโฟลเดอร์ chat
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${req.file.originalname}`;
  
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };
  
    await s3Client.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  
    res.json({ 
      success: true, 
      fileUrl: fileUrl,
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์' });
  }
};
exports.getChatHistory = async (req, res) => {
    const { user1, user2 } = req.query;

    if (!user1 || !user2) {
        return res.status(400).json({
            success: false,
            error: "Missing user1 or user2 query parameter",
        });
    }

    try {
        const chats = await Message.find({
            $or: [
                { senderId: user1, receiverId: user2 },
                { senderId: user2, receiverId: user1 },
            ],
        }).sort({ timestamp: 1 });

        res.json({ success: true, messages: chats });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.saveMessage = async (data) => {
    try {
        const message = new Message({
            senderId: data.senderId,
            receiverId: data.receiverId,
            text: data.text,
            fileUrl: data.fileUrl,
            timestamp: data.timestamp || new Date(),
        });

        await message.save();
        return message;
    } catch (error) {
        console.error("Error saving message:", error);
        throw error;
    }
};

exports.saveMessageHandler = async (req, res) => {
    try {
        const message = await exports.saveMessage(req.body);
        res.json({
            success: true,
            message: {
                _id: message._id,
                senderId: message.senderId,
                receiverId: message.receiverId,
                text: message.text,
                timestamp: message.timestamp,
            },
        });
    } catch (error) {
        console.error("Error saving message:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
