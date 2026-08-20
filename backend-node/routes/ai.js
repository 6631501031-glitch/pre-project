const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

router.post('/ask', async (req, res) => {
  const { message } = req.body || {};

  if (typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'ต้องระบุ message เป็นข้อความที่ไม่ว่าง' });
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      messages: [{ role: 'user', content: message }],
    });

    if (response.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'คำถามนี้ไม่สามารถตอบได้' });
    }

    const reply = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    res.status(200).json({ reply, stop_reason: response.stop_reason });
  } catch (err) {
    console.error('AI ask failed:', err);

    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'มีการเรียกใช้งานถี่เกินไป กรุณาลองอีกครั้ง' });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: 'ตั้งค่า ANTHROPIC_API_KEY ไม่ถูกต้อง' });
    }
    if (err instanceof Anthropic.APIError) {
      return res.status(502).json({ error: 'เรียกใช้บริการ AI ไม่สำเร็จ' });
    }

    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
