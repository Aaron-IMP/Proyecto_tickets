require('dotenv').config();
const pool = require('../src/config/database');

const BANNERS = {
  rock:        'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=900&q=80&fit=crop',
  reggaeton:   'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=900&q=80&fit=crop',
  urbano:      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&q=80&fit=crop',
  estadio:     'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=900&q=80&fit=crop',
  trap:        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80&fit=crop',
};

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Actualizar banners de eventos existentes
    await client.query(
      `UPDATE evento SET banner_url = $1 WHERE id = 1`,
      [BANNERS.rock]
    );
    await client.query(
      `UPDATE evento SET banner_url = $1 WHERE id = 2`,
      [BANNERS.reggaeton]
    );

    // Insertar 3 eventos nuevos
    const nuevos = [
      {
        nombre:          'Colores World Tour',
        nombre_artista:  'J Balvin',
        fecha_hora:      '2026-10-10 19:00:00',
        lugar:           'Estadio San Marcos, Lima',
        descripcion:     'El espectáculo más colorido del año. J Balvin trae su tour más ambicioso a Lima con un show de luces y visuales increíbles.',
        banner_url:      BANNERS.urbano,
        categorias: [
          { zona: 'Campo',    precio: 180, stock: 800 },
          { zona: 'Tribuna',  precio: 280, stock: 400 },
          { zona: 'Palco VIP', precio: 550, stock: 80 },
        ],
      },
      {
        nombre:          'Nicky Jam — X Tour',
        nombre_artista:  'Nicky Jam',
        fecha_hora:      '2026-11-05 20:00:00',
        lugar:           'Arena Lima, Lima',
        descripcion:     'Nicky Jam regresa a Lima con sus grandes éxitos y nuevo material de su X Tour internacional.',
        banner_url:      BANNERS.trap,
        categorias: [
          { zona: 'General',   precio: 130, stock: 600 },
          { zona: 'Preferente', precio: 320, stock: 200 },
        ],
      },
      {
        nombre:          'Daddy Yankee — La Última Vuelta',
        nombre_artista:  'Daddy Yankee',
        fecha_hora:      '2026-12-15 19:30:00',
        lugar:           'Estadio Nacional, Lima',
        descripcion:     'El Cangri vuelve con su gira de despedida. Una noche histórica con todos sus clásicos y un espectáculo sin precedentes.',
        banner_url:      BANNERS.estadio,
        categorias: [
          { zona: 'General',   precio: 200, stock: 1000 },
          { zona: 'VIP',       precio: 480, stock: 200 },
          { zona: 'Platinum',  precio: 850, stock: 60  },
        ],
      },
    ];

    for (const ev of nuevos) {
      const res = await client.query(
        `INSERT INTO evento (nombre, nombre_artista, fecha_hora, lugar, descripcion, banner_url, administrador_id)
         VALUES ($1,$2,$3,$4,$5,$6,1) RETURNING id`,
        [ev.nombre, ev.nombre_artista, ev.fecha_hora, ev.lugar, ev.descripcion, ev.banner_url]
      );
      const eventoId = res.rows[0].id;

      for (const cat of ev.categorias) {
        await client.query(
          `INSERT INTO categoria_ticket (evento_id, nombre_zona, precio, stock_total, stock_disponible)
           VALUES ($1,$2,$3,$4,$4)`,
          [eventoId, cat.zona, cat.precio, cat.stock]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Seed completado:');
    console.log('  - 2 eventos actualizados con banner');
    console.log('  - 3 eventos nuevos insertados');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en seed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
