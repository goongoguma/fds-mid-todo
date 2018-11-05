import "@babel/polyfill"; // 이 라인을 지우지 말아주세요!
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://recondite-baboon.glitch.me/'
})

// 로컬스토리지에 토큰이 저장이 되어있으면 요청에 토큰에 포함시키고 없으면 포함시키지 않는 코드
api.interceptors.request.use(function (config) {
  // localStorage에 token이 있으면 요청에 헤더 설정, 없으면 아무것도 하지 않음
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = 'Bearer ' + token
  }
  return config
});


const templates = {
  loginForm: document.querySelector('#login-form').content,
  todoList: document.querySelector('#todo-list').content,
  todoItem: document.querySelector('#todo-item').content
}

const rootEl = document.querySelector('.root');

function drawLoginForm() {
  // 1. 템플릿 복사하기
  const fragment = document.importNode(templates.loginForm, true);

  // 2. 내용 채우고, 이벤트 리스너 등록하기
  const loginFormEl = fragment.querySelector('.login-form');
  loginFormEl.addEventListener('submit', async e => {
    e.preventDefault();
    // e: 이벤트 객체
    // e.target: 이벤트를 실제로 일으킨 요소 객체 (loginFormEl)
    // e.target.elements: 폼 내부에 들어있는 요소 객체를 편하게 가져올 수 있는 특이한 객체
    // e.target.elements.username: input 요소 객체의 name 어트리뷰트
    // .value: 사용자가 input 태그에 입력한 값
    const username = e.target.elements.username.value;
    const password = e.target.elements.password.value;

    // 응답객체
    const res = await api.post('/users/login', {
      username, //(username: username)
      password
    })
    localStorage.setItem('token', res.data.token);

    // 로그인 뒤에 TodoList 페이지로 넘겨주기 
    drawTodoList()
  })

  // 3. 문서 내부에 삽입하기
  rootEl.textContent = '';
  rootEl.appendChild(fragment)
}

// 통신해주기 위해 async를 추가
async function drawTodoList() {
  // const list = [
  //   {
  //     id: 1,
  //     userId: 2,
  //     body: 'React 공부',
  //     complete: false
  //   },
  //   {
  //     id: 2,
  //     userId: 2,
  //     body: 'React Router 공부',
  //     complete: false
  //   }
  // ]

  // 진짜 데이터 가져오기
  const res = await api.get('/todos');
  const list = res.data;

  // 1. 템플릿 복사하기
  const fragment = document.importNode(templates.todoList, true)

  // 2. 내용 채우고 이벤트 리스너 등록하기 (ul에 등록하기)
  const todoListEl = fragment.querySelector('.todo-list')

  // 총 두번 실행된다. (list)
  list.forEach(todoItem => {
    // 1. 템플릿 복사하기
    const fragment = document.importNode(templates.todoItem, true)

    // 2. 내용 채우고 이벤트 리스너 등록하기 (ul에 등록하기)
    const bodyEl = fragment.querySelector('.body')
    bodyEl.textContent = todoItem.body

    // 3. 문서 내부에 삽입하기 
    todoListEl.appendChild(fragment)
  })

  // 3. 문서 내부에 삽입하기 
  rootEl.textContent='';
  rootEl.appendChild(fragment);
}

drawLoginForm();
