const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  findUserByEmail,
  findUserById,
  findUserByIdWithPassword,
  createUser,
  updateUserProfile,
  updateUserPassword,
  deleteUser,
} = require('../queries/userQueries');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, password: hashed });

    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный email или пароль' });
    }

    const token = generateToken(user);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };

    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
}

async function me(req, res) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json(user);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Имя и email обязательны' });
    }

    const existing = await findUserByEmail(email);
    if (existing && existing.id !== req.user.id) {
      return res.status(400).json({ message: 'Этот email уже используется другим пользователем' });
    }

    const user = await updateUserProfile(req.user.id, { name, email });
    res.json(user);
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: 'Ошибка обновления профиля' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Заполните все поля' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Новый пароль должен быть не короче 6 символов' });
    }

    const user = await findUserByIdWithPassword(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Текущий пароль неверный' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(req.user.id, hashed);

    res.json({ message: 'Пароль успешно изменён' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ message: 'Ошибка смены пароля' });
  }
}

async function deleteAccount(req, res) {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Введите пароль для подтверждения' });
    }

    const user = await findUserByIdWithPassword(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный пароль' });
    }

    await deleteUser(req.user.id);
    res.json({ message: 'Аккаунт удалён' });
  } catch (err) {
    console.error('deleteAccount error:', err);
    res.status(500).json({ message: 'Ошибка удаления аккаунта' });
  }
}

module.exports = {
  register,
  login,
  me,
  updateProfile,
  changePassword,
  deleteAccount,
};
