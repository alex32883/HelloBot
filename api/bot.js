// Минимальная версия для тестирования
module.exports = async (req, res) => {
  console.log('=== SIMPLE FUNCTION CALLED ===');
  console.log('Method:', req.method);
  
  // Сразу возвращаем 200 OK для всех запросов
  res.status(200).json({ ok: true, message: 'Simple handler works' });
};
