import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = express.Router();

// Middleware to check auth
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
  next();
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Acesso negado' });
  next();
};

// --- MENUS ---

// Get all menus (public/protected depending on needs, let's say public for viewing)
router.get('/menus', (req, res) => {
  try {
    const menus = db.prepare('SELECT * FROM menus ORDER BY date ASC').all() as any[];
    const menusWithOptions = menus.map(menu => {
      const options = db.prepare('SELECT * FROM menu_options WHERE menu_id = ?').all(menu.id);
      return {
        ...menu,
        diaSemana: menu.dia_semana,
        pdfUrl: menu.pdf_url,
        pdfNome: menu.pdf_nome,
        criadoEm: menu.created_at,
        atualizadoEm: menu.updated_at,
        opcoes: options.map((opt: any) => ({
          ...opt,
          nomePrato: opt.nome_prato,
          imageUrl: opt.image_url
        }))
      };
    });
    res.json(menusWithOptions);
  } catch (error) {
    console.error('Get menus error:', error);
    res.status(500).json({ error: 'Erro ao buscar cardápios' });
  }
});

// Create/Update Menu (Admin only)
router.post('/menus', requireAdmin, (req, res) => {
  const { id, data, diaSemana, status, opcoes, pdfUrl, pdfNome } = req.body;
  
  if (!data || !diaSemana || !status) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const menuId = id || uuidv4();

  try {
    const existingMenu = db.prepare('SELECT id FROM menus WHERE id = ?').get(menuId);

    if (existingMenu) {
      db.prepare(`
        UPDATE menus 
        SET data = ?, dia_semana = ?, status = ?, pdf_url = ?, pdf_nome = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(data, diaSemana, status, pdfUrl, pdfNome, menuId);
      
      // Delete existing options to replace
      db.prepare('DELETE FROM menu_options WHERE menu_id = ?').run(menuId);
    } else {
      db.prepare(`
        INSERT INTO menus (id, data, dia_semana, status, pdf_url, pdf_nome)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(menuId, data, diaSemana, status, pdfUrl, pdfNome);
    }

    // Insert options
    const insertOption = db.prepare(`
      INSERT INTO menu_options (id, menu_id, tipo, nome_prato, descricao, alergenos, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    opcoes.forEach((opt: any) => {
      insertOption.run(
        opt.id || uuidv4(),
        menuId,
        opt.tipo,
        opt.nomePrato,
        opt.descricao,
        opt.alergenos,
        opt.imageUrl
      );
    });

    res.json({ message: 'Cardápio salvo com sucesso', id: menuId });
  } catch (error) {
    console.error('Save menu error:', error);
    res.status(500).json({ error: 'Erro ao salvar cardápio' });
  }
});

// --- ORDERS ---

// Get Orders (Admin sees all, Student sees own)
router.get('/orders', requireAuth, (req: any, res) => {
  try {
    let orders;
    if (req.user.role === 'ADMIN') {
      orders = db.prepare(`
        SELECT o.*, u.name as user_name, u.turma as user_turma, mo.nome_prato as opcao_nome, mo.tipo as opcao_tipo
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN menu_options mo ON o.menu_option_id = mo.id
        ORDER BY o.date DESC
      `).all();
    } else {
      orders = db.prepare(`
        SELECT o.*, u.name as user_name, u.turma as user_turma, mo.nome_prato as opcao_nome, mo.tipo as opcao_tipo
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN menu_options mo ON o.menu_option_id = mo.id
        WHERE o.user_id = ?
        ORDER BY o.date DESC
      `).all(req.user.id);
    }

    const formattedOrders = orders.map((o: any) => ({
      id: o.id,
      data: o.date,
      hora: new Date(o.created_at + 'Z').toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }),
      nomeSolicitante: o.user_name,
      turma: o.user_turma,
      numeroTicket: o.numero_ticket,
      tipo: o.opcao_tipo,
      opcaoId: o.menu_option_id,
      opcaoNome: o.opcao_nome,
      status: o.status,
      criadoPor: o.created_by,
      motivoAdmin: o.motivo_admin,
      criadoEm: o.created_at,
      atualizadoEm: o.updated_at
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// Create Order
router.post('/orders', requireAuth, (req: any, res) => {
  const { data, opcaoId, numeroTicket, status, criadoPor } = req.body;
  
  // Validation logic...
  
  const orderId = uuidv4();
  const userId = req.user.id; // Or from body if Admin creating for someone else (advanced)

  try {
    // Check for existing active order for this date
    const existing = db.prepare('SELECT id FROM orders WHERE user_id = ? AND date = ? AND status = ?').get(userId, data, 'ATIVO');
    if (existing) {
      return res.status(400).json({ error: 'Já existe um pedido ativo para esta data' });
    }

    db.prepare(`
      INSERT INTO orders (id, user_id, menu_option_id, date, status, numero_ticket, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, userId, opcaoId, data, status || 'ATIVO', numeroTicket, criadoPor || 'ALUNO');

    res.status(201).json({ message: 'Pedido criado', id: orderId });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// Cancel Order
router.post('/orders/:id/cancel', requireAuth, (req: any, res) => {
  const { id } = req.params;
  const { motivo, adminId } = req.body;

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    if (req.user.role !== 'ADMIN' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    db.prepare(`
      UPDATE orders 
      SET status = 'CANCELADO', motivo_admin = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(motivo || null, id);

    res.json({ message: 'Pedido cancelado' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Erro ao cancelar pedido' });
  }
});

// --- FEEDBACKS ---
router.get('/feedbacks', requireAuth, (req: any, res) => {
    // Implement feedback retrieval logic
    // For brevity, returning empty array or basic implementation
    try {
        const feedbacks = db.prepare(`
            SELECT f.*, o.date as data_pedido, u.name as nome_solicitante, u.turma, mo.nome_prato as opcao_nome
            FROM feedbacks f
            JOIN orders o ON f.order_id = o.id
            JOIN users u ON o.user_id = u.id
            JOIN menu_options mo ON o.menu_option_id = mo.id
            ORDER BY f.created_at DESC
        `).all();
        
        const formatted = feedbacks.map((f: any) => ({
            id: f.id,
            pedidoId: f.order_id,
            opcaoId: f.menu_option_id, // Note: join needed to get this directly if not in feedback table
            opcaoNome: f.opcao_nome,
            data: f.data_pedido,
            nomeSolicitante: f.nome_solicitante,
            turma: f.turma,
            nota: f.rating,
            comentario: f.comment,
            criadoEm: f.created_at
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar feedbacks' });
    }
});

router.post('/feedbacks', requireAuth, (req: any, res) => {
    const { pedidoId, nota, comentario } = req.body;
    const id = uuidv4();
    try {
        db.prepare(`
            INSERT INTO feedbacks (id, order_id, rating, comment)
            VALUES (?, ?, ?, ?)
        `).run(id, pedidoId, nota, comentario);
        res.status(201).json({ message: 'Feedback enviado' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar feedback' });
    }
});

export default router;
