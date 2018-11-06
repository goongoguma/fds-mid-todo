import "@babel/polyfill"
import axios from 'axios';
import { isRegExp } from "util";

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
  const fragment = document.importNode(templates.todoList, true);

  // 2. 내용 채우고 이벤트 리스너 등록하기 (ul에 등록하기)
  const todoListEl = fragment.querySelector('.todo-list');
  const todoFormEl = fragment.querySelector('.todo-form');
  const logoutEl = fragment.querySelector('.logout');


  logoutEl.addEventListener('click', e => {
    // 로그아웃 절차
    // 1. 토큰 삭제
    localStorage.removeItem('token');
    // 2. 로그인폼 보여주기
    drawLoginForm()
  })

  // todolist 한번 그릴때 폼도 한번 그리면 된다.
  todoFormEl.addEventListener('submit', async e => {
    e.preventDefault();
    // 로딩인디케이터 추가
    document.body.classList.add('loading');
    const body = e.target.elements.body.value;
    const res = await api.post('/todos', {
      body,
      complete: false
    })
    drawTodoList();

    // 로딩인디케이터 삭제
    document.body.classList.remove('loading')
  })

  // 총 두번 실행된다. (list)
  list.forEach(todoItem => {
    // 1. 템플릿 복사하기
    const fragment = document.importNode(templates.todoItem, true)

    // 2. 내용 채우고 이벤트 리스너 등록하기 (ul에 등록하기)
    const bodyEl = fragment.querySelector('.body');
    const deleteEl = fragment.querySelector('.delete');
    const completeEl = fragment.querySelector('.complete');

    deleteEl.addEventListener('click', async e => {

      // 데이터로부터 내가 경로를 만들어 줄 수 있다.
      await api.delete(`/todos/${todoItem.id}`);
      // 성공 시 할 일 목록 다시 그리기
      drawTodoList();
    })

    // 체크박스
    completeEl.addEventListener('click', async e => {
      // 주석을 풀면 비관적 업데이트 방식으로 변한다.
     // e.preventDefault();
     await api.patch(`/todos/${todoItem.id}`, {
       // !을 사용하면 true를 false로 false를 true로 바꿔준다.
       complete: !todoItem.complete
     })
     drawTodoList()
    })

    if(todoItem.complete) {
      completeEl.setAttribute('checked', '')
    }


    bodyEl.textContent = todoItem.body

    // 3. 문서 내부에 삽입하기
    todoListEl.appendChild(fragment)
  })

  // 3. 문서 내부에 삽입하기
  rootEl.textContent='';
  rootEl.appendChild(fragment);
}

// 만약 로그인을 한 상태라면 바로 할 일 목록을 보여주고
if(localStorage.getItem('token')) {
  drawTodoList()
} else {
  // 아니라면 로그인 폼을 보여준다.
  drawLoginForm()
}

// 프론트엔드 개발자의 두 종류의  개발방법

// 비관적 업데이트 : 사용자 입력 -> 수정 요청 -> 성공시 화면이 갱신 / 비관적 업데이트일 경우 loading indicator를 사용하는게 좋다.


// 낙관적 업데이트 : 사용자 입력 -> 바로 화면 갱신 -> 수정 요청
// -> 낙관적 업데이트는 수정이 성공했을 때(끝)와 실패했을 때(원상복구필요)의 처리가 다른 단점이 있다.
// -> 낙관적 업데이트는 사용자 입장에서는 편하지만 개발자 입장에서는 구현하기가 까다롭다.
