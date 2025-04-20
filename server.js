const express = require('express');
const app = express();
const port = 3000;

// Base de données simulée
let tasks = [
  { id: 1, name: "Exemple de tâche", completed: false }
];

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes API
app.get('/tasks', (req, res) => res.json(tasks));

app.post('/tasks', (req, res) => {
  const task = { id: Date.now(), ...req.body };
  tasks.push(task);
  res.status(201).json(task);

  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Le texte de la tâche est requis.' });
  }
  
});

// Marquer une tâche comme terminée ou en cours (toggle)
app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ message: 'Tâche introuvable' });
  }

  if (req.body.name !== undefined) {
    if (!req.body.name.trim()) {
      return res.status(400).json({ message: 'Nom de tâche invalide' });
    }
    task.name = req.body.name;
  } else {
    task.completed = !task.completed;
  }
  res.json(task);
});


// Supprimer une tâche

app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const index = tasks.findIndex(t => t.id === taskId);

  if (index === -1) {
    return res.status(404).json({ message: 'Tâche introuvable' });
  }

  tasks.splice(index, 1);
  res.status(204).end();
});

// Démarrage du serveur
app.listen(port, () => console.log(`Serveur démarré sur http://localhost:${port}`));
