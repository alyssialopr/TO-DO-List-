const saveToLocalStorage = (tasks) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

const loadFromLocalStorage = () => {
  const stored = localStorage.getItem('tasks');
  return stored ? JSON.parse(stored) : [];
};

document.getElementById('addTaskBtn').addEventListener('click', () => {
  const taskInput = document.getElementById('taskInput');
  if (taskInput.value.trim()) {
    fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: taskInput.value })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout");
      }
      return response.json();
    })
    .then(task => {
      taskInput.value = '';
      renderTask(task);

      const currentTasks = loadFromLocalStorage();
      saveToLocalStorage([...currentTasks, task]);
    })
    .catch(err => alert(err.message));
  } else {
    alert("La tâche ne peut pas être vide !");
  }
});

const renderTask = (task) => {
  const taskList = document.getElementById('taskList');
  const li = document.createElement('li');
  li.dataset.id = task.id;
  li.classList.add('fade-in');
  li.setAttribute('draggable', 'true');

  li.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    li.classList.add('dragging');
  });

  li.addEventListener('dragend', () => {
    li.classList.remove('dragging');
  });

  const span = document.createElement('span');
  span.textContent = task.name;
  if (task.completed) {
    span.style.color = 'gray';
  }

  span.addEventListener('dblclick', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = task.name;
    input.classList.add('edit-input');
    li.replaceChild(input, span);
    input.focus();

    const saveEdit = () => {
      const newName = input.value.trim();
      if (!newName) {
        alert("Le nom de la tâche ne peut pas être vide !");
        return;
      }

      fetch(`/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      })
      .then(res => res.json())
      .then(updatedTask => {
        task.name = updatedTask.name;
        span.textContent = updatedTask.name;

        if (task.completed) {
          span.style.color = 'gray';
          span.style.textDecoration = 'line-through';
          span.style.fontStyle = 'italic';
        } else {
          span.style.color = '';
          span.style.textDecoration = '';
          span.style.fontStyle = '';
        }

        li.replaceChild(span, input);

        const tasks = loadFromLocalStorage().map(t =>
          t.id === updatedTask.id ? updatedTask : t
        );
        saveToLocalStorage(tasks);
      });
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveEdit();
    });
  });

  const doneBtn = document.createElement('button');
  doneBtn.textContent = 'Terminé';
  doneBtn.classList.add('done-btn');

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Supprimer';
  deleteBtn.classList.add('delete-btn');

  doneBtn.addEventListener('click', () => {
    fetch(`/tasks/${task.id}`, { method: 'PUT' })
      .then(res => res.json())
      .then(updatedTask => {
        span.textContent = updatedTask.name;
        if (updatedTask.completed) {
          span.style.color = 'gray';
          span.style.fontStyle = 'italic';
          span.style.textDecoration = 'line-through';
        } else {
          span.style.color = '';
          span.style.fontStyle = '';
          span.style.textDecoration = '';
        }

        const tasks = loadFromLocalStorage().map(t =>
          t.id === updatedTask.id ? updatedTask : t
        );
        saveToLocalStorage(tasks);
      });
  });

  deleteBtn.addEventListener('click', () => {
    li.classList.add('fade-out');
    setTimeout(() => {
      fetch(`/tasks/${task.id}`, { method: 'DELETE' })
      .then(() => {
        li.remove();
        const tasks = loadFromLocalStorage().filter(t => t.id !== task.id);
        saveToLocalStorage(tasks);
      });
    }, 300);
  });

  li.appendChild(span);
  li.appendChild(doneBtn);
  li.appendChild(deleteBtn);
  taskList.appendChild(li);
};

const renderFilteredTasks = (tasks, filter) => {
  const taskList = document.getElementById('taskList');
  taskList.innerHTML = '';
  if (filter === 'pending') {
    tasks = tasks.filter(task => !task.completed);
  } else if (filter === 'completed') {
    tasks = tasks.filter(task => task.completed);
  }
  tasks.forEach(renderTask);
};

const loadTasks = (filter = 'all') => {
  const loader = document.getElementById('loader');
  loader.style.display = 'block';
  document.getElementById('taskList').innerHTML = '';

  fetch('/tasks')
    .then(response => {
      if (!response.ok) throw new Error('Erreur serveur');
      return response.json();
    })
    .then(tasks => {
      saveToLocalStorage(tasks); 
      renderFilteredTasks(tasks, filter);
    })
    .catch(() => {
      const localTasks = loadFromLocalStorage();
      renderFilteredTasks(localTasks, filter);
    })
    .finally(() => {
      loader.style.display = 'none';
    });
};

document.getElementById('filter').addEventListener('change', (e) => {
  loadTasks(e.target.value);
});

// Charger au démarrage
window.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
});

// DRAG & DROP LOGIC EN BAS

document.getElementById('taskList').addEventListener('dragover', (e) => {
  e.preventDefault();
  const dragging = document.querySelector('.dragging');
  const afterElement = getDragAfterElement(e.clientY);
  const taskList = document.getElementById('taskList');
  if (afterElement == null) {
    taskList.appendChild(dragging);
  } else {
    taskList.insertBefore(dragging, afterElement);
  }
});

document.getElementById('taskList').addEventListener('drop', () => {
  saveTasksOrder();
});

const getDragAfterElement = (y) => {
  const taskList = document.getElementById('taskList');
  const draggableElements = [...taskList.querySelectorAll('li:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
};

const setTheme = (theme) => {
  if (theme === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('themeToggle').textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    document.getElementById('themeToggle').textContent = '🌙';
  }
  localStorage.setItem('theme', theme);
};

document.getElementById('themeToggle').addEventListener('click', () => {
  const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
});

// Sauvegarder l'ordre après drag & drop
const saveTasksOrder = () => {
  const lis = document.querySelectorAll('#taskList li');
  const ids = Array.from(lis).map(li => li.dataset.id);
  const currentTasks = loadFromLocalStorage();
  const newOrder = ids.map(id => currentTasks.find(t => t.id.toString() === id)).filter(Boolean);
  saveToLocalStorage(newOrder);
};