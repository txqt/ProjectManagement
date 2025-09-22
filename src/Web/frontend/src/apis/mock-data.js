export const mockData = {
  users: [
    { id: 'user-01', name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1' },
    { id: 'user-02', name: 'Bob', avatar: 'https://i.pravatar.cc/150?img=2' },
    { id: 'user-03', name: 'Charlie', avatar: 'https://i.pravatar.cc/150?img=3' },
    { id: 'user-04', name: 'David', avatar: 'https://i.pravatar.cc/150?img=4' },
    { id: 'user-05', name: 'Eve', avatar: 'https://i.pravatar.cc/150?img=5' }
  ],
  board: {
    id: 'board-id-01',
    title: 'Project Trello Clone',
    description: 'Learning project with MERN',
    type: 'public',
    ownerId: 'user-01',
    adminIds: ['user-02'],
    memberIds: ['user-03', 'user-04', 'user-05'],
    columnOrderIds: ['column-id-01', 'column-id-02', 'column-id-03', 'column-id-04'],
    columns: [
      {
        id: 'column-id-01',
        boardId: 'board-id-01',
        title: 'To Do',
        cardOrderIds: ['card-id-01', 'card-id-02', 'card-id-05'],
        cards: [
          {
            id: 'card-id-01',
            boardId: 'board-id-01',
            columnId: 'column-id-01',
            title: 'Setup project structure',
            description: 'Initialize backend & frontend folder',
            cover: "https://i0.wp.com/blog.pensoft.net/wp-content/uploads/2021/09/covergushter.jpg?fit=900%2C506&ssl=1",
            memberIds: ['user-01', 'user-03'],
            comments: [
              { id: 'cmt-01', userId: 'user-03', content: 'I can handle backend setup.', createdAt: '2023-06-28T09:00:00Z' },
              { id: 'cmt-02', userId: 'user-01', content: 'Cool, I will setup frontend.', createdAt: '2023-06-28T10:00:00Z' }
            ],
            attachments: [
              { id: 'att-01', name: 'requirements.docx', url: '/files/req.docx', type: 'doc' }
            ]
          },
          {
            id: 'card-id-02',
            boardId: 'board-id-01',
            columnId: 'column-id-01',
            title: 'Research drag & drop',
            description: null,
            cover: null,
            memberIds: [],
            comments: [],
            attachments: []
          },
          {
            id: 'card-id-05',
            boardId: 'board-id-01',
            columnId: 'column-id-01',
            title: 'Prepare API documentation',
            description: 'Swagger or Postman collections',
            cover: null,
            memberIds: ['user-05'],
            comments: [
              { id: 'cmt-05', userId: 'user-05', content: 'I will start writing endpoints list.', createdAt: '2023-07-01T09:00:00Z' }
            ],
            attachments: []
          }
        ]
      },
      {
        id: 'column-id-02',
        boardId: 'board-id-01',
        title: 'In Progress',
        cardOrderIds: ['card-id-03', 'card-id-06'],
        cards: [
          {
            id: 'card-id-03',
            boardId: 'board-id-01',
            columnId: 'column-id-02',
            title: 'Implement login',
            description: 'Basic JWT authentication',
            cover: null,
            memberIds: ['user-02'],
            comments: [],
            attachments: []
          },
          {
            id: 'card-id-06',
            boardId: 'board-id-01',
            columnId: 'column-id-02',
            title: 'Setup CI/CD pipeline',
            description: 'Using GitHub Actions',
            cover: 'https://miro.medium.com/v2/resize:fit:1200/1*3ZFWy7Q2A1cF4B8dShUfmw.png',
            memberIds: ['user-04', 'user-02'],
            comments: [
              { id: 'cmt-06', userId: 'user-02', content: 'I’ll handle deploy to staging first.', createdAt: '2023-07-02T11:30:00Z' }
            ],
            attachments: []
          }
        ]
      },
      {
        id: 'column-id-03',
        boardId: 'board-id-01',
        title: 'Done',
        cardOrderIds: ['card-id-04'],
        cards: [
          {
            id: 'card-id-04',
            boardId: 'board-id-01',
            columnId: 'column-id-03',
            title: 'Design database schema',
            description: 'Users, Boards, Columns, Cards',
            cover: "https://i0.wp.com/blog.pensoft.net/wp-content/uploads/2021/09/covergushter.jpg?fit=900%2C506&ssl=1",
            memberIds: ['user-01', 'user-02'],
            comments: [],
            attachments: []
          }
        ]
      },
      {
        id: 'column-id-04',
        boardId: 'board-id-01',
        title: 'Blocked',
        cardOrderIds: ['card-id-07'],
        cards: [
          {
            id: 'card-id-07',
            boardId: 'board-id-01',
            columnId: 'column-id-04',
            title: 'Waiting for client feedback',
            description: 'UI design review pending',
            cover: null,
            memberIds: ['user-03'],
            comments: [
              { id: 'cmt-07', userId: 'user-03', content: 'Still no reply from client.', createdAt: '2023-07-03T08:15:00Z' }
            ],
            attachments: []
          }
        ]
      }
    ]
  }
}
