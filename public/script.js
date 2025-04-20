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
      renderTask(task); // Ajout dynamique dans l'interface
    })
    .catch(err => alert(err.message));
  } else {
    alert("La tâche ne peut pas être vide !");
  }
});



// Fonction pour afficher une tâche
function renderTask(task) {
  const taskList = document.getElementById('taskList');
  const li = document.createElement('li');
  li.dataset.id = task.id;
  li.classList.add('fade-in');

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
          } else {
            span.style.color = '';
            span.style.textDecoration = '';
          }
          li.replaceChild(span, input);
        });
    };
  
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        saveEdit();
      }
    });
  });

  const doneBtn = document.createElement('button');
  doneBtn.textContent = 'Terminé';
  doneBtn.classList.add('done-btn');

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Supprimer';
  deleteBtn.classList.add('delete-btn');

  // Button Terminé 
  doneBtn.addEventListener('click', () => {
    fetch(`/tasks/${task.id}`, {
      method: 'PUT'
    })
      .then(res => res.json())
      .then(updatedTask => {
        span.textContent = updatedTask.name;

        if (updatedTask.completed) {
          span.style.color = 'gray';
        } else {
          span.style.color = '';
        }
      });
  });

  // Button Supprimer
  deleteBtn.addEventListener('click', () => {
    li.classList.add('fade-out');
    setTimeout(() => {
      fetch(`/tasks/${task.id}`, {
        method: 'DELETE'
      })
      .then(() => {
        li.remove();
      });
    }, 300); 
  });

  li.appendChild(span);
  li.appendChild(doneBtn);
  li.appendChild(deleteBtn);
  taskList.appendChild(li);
}




// Fonction pour charger et afficher les tâches avec le filtre
function loadTasks(filter = 'all') {
  const loader = document.getElementById('loader');
  const taskList = document.getElementById('taskList');

  loader.style.display = 'block';
  taskList.innerHTML = '';

  fetch('/tasks')
    .then(response => response.json())
    .then(tasks => {
      const taskList = document.getElementById('taskList');
      loader.style.display = 'none';
      if (filter === 'pending') {
        tasks = tasks.filter(task => !task.completed); 
      } else if (filter === 'completed') {
        tasks = tasks.filter(task => task.completed); 
      }
      tasks.forEach(renderTask);
    });
}
document.getElementById('filter').addEventListener('change', (e) => {
  loadTasks(e.target.value);
});

// Charger les tâches au démarrage
window.addEventListener('DOMContentLoaded', () => {
  fetch('/tasks')
    .then(response => response.json())
    .then(tasks => {
      const taskList = document.getElementById('taskList');
      taskList.innerHTML = '';
      tasks.forEach(renderTask);
    });
});