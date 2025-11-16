const API = "http://localhost:3000/api/tasks";
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const template = document.getElementById('task-template');

async function fetchTasks(){
  try {
    const res = await fetch(API);
    if(!res.ok) throw new Error(`GET /api/tasks failed: ${res.status} ${res.statusText}`);
    const tasks = await res.json();
    render(tasks);
  } catch (err) {
    console.error('fetchTasks error:', err);
    alert('Unable to load tasks — see console for details.');
  }
}

function render(tasks){
  list.innerHTML = '';
  tasks.forEach(t => {
    const clone = template.content.cloneNode(true);
    const li = clone.querySelector('li');
    const text = clone.querySelector('.task-text');
    const checkbox = clone.querySelector('.complete-checkbox');
    const editBtn = clone.querySelector('.edit');
    const delBtn = clone.querySelector('.delete');

    li.dataset.id = t.id;
    text.textContent = t.title;
    text.classList.toggle('completed', !!t.done);
    checkbox.checked = !!t.done;

    checkbox.addEventListener('change', () => toggleDone(t.id, checkbox.checked));
    delBtn.addEventListener('click', () => deleteTask(t.id));
    editBtn.addEventListener('click', () => editTask(t.id, t.title));

    list.appendChild(clone);
  });
}

form.addEventListener('submit', async e =>{
  e.preventDefault();
  const title = input.value.trim();
  if(!title) return;

  // disable submit while request in progress
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch(API, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({title})
    });

    const bodyText = await res.text();
    let json;
    try { json = JSON.parse(bodyText); } catch (e) { json = bodyText; }

    if (!res.ok) {
      console.error('POST /api/tasks failed', res.status, res.statusText, json);
      alert('Failed to add task — check console and server logs.');
    } else {
      console.log('Task added:', json);
      input.value = '';
      await fetchTasks();
    }
  } catch (err) {
    console.error('Error while adding task:', err);
    alert('Network error — see console.');
  } finally {
    submitBtn.disabled = false;
  }
});

async function toggleDone(id, done){
  try {
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({done})
    });
    if(!res.ok) {
      console.error('PUT /api/tasks/:id failed', res.status, await res.text());
      alert('Could not update task. See console.');
    }
    await fetchTasks();
  } catch (err) {
    console.error('toggleDone error:', err);
    alert('Network error while updating task.');
  }
}

async function deleteTask(id){
  if(!confirm('Delete this task?')) return;
  try {
    const res = await fetch(`${API}/${id}`, {method:'DELETE'});
    if(!res.ok) {
      console.error('DELETE /api/tasks/:id failed', res.status, await res.text());
      alert('Failed to delete task. See console.');
    }
    await fetchTasks();
  } catch (err) {
    console.error('deleteTask error:', err);
    alert('Network error while deleting task.');
  }
}

async function editTask(id, oldTitle){
  const newTitle = prompt('Edit task', oldTitle);
  if(newTitle === null) return;
  const trimmed = newTitle.trim();
  if(!trimmed) return alert('Title cannot be empty');
  try {
    const res = await fetch(`${API}/${id}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({title: trimmed})
    });
    if(!res.ok) {
      console.error('PUT edit failed', res.status, await res.text());
      alert('Failed to edit task. See console.');
    }
    await fetchTasks();
  } catch (err) {
    console.error('editTask error:', err);
    alert('Network error while editing task.');
  }
}

// initialize
fetchTasks();
