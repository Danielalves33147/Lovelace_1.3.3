/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TextArea from '../components/TextArea';
import QuestionBox from '../components/QuestionBox';
import styles from './FormActivity.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus} from '@fortawesome/free-solid-svg-icons';

// Gerar um código de acesso aleatório
function generateAccessCode(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function FormActivity({ activity = null }) {
    const [user, setUser] = useState(() => {
        const storedUser = sessionStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const storedUser = sessionStorage.getItem('user');
            setUser(storedUser ? JSON.parse(storedUser) : null);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const navigate = useNavigate();

    const [activities, setActivities] = useState({
        name: activity?.name || "",
        description: activity?.description || "",
        accessCode: activity?.accessCode || generateAccessCode(),
        questions: activity?.questions || [],
        date: activity?.date || new Date().toISOString()
    });

    const handleChange = (e) => {
        setActivities({
            ...activities,
            [e.target.name]: e.target.value
        });
    };

    const addQuestion = () => {
        setActivities({
            ...activities,
            questions: [...activities.questions, { id: Date.now(), proposal: '', text: '' }]
        });
    };

    const handleQuestionChange = (id, field, value) => {
        const updatedQuestions = activities.questions.map(question => {
            if (question.id === id) {
                return { ...question, [field]: value };
            }
            return question;
        });
        setActivities({ ...activities, questions: updatedQuestions });
    };

    const removeQuestion = (id) => {
        const questionsUpdated = activities.questions.filter(question => question.id !== id);
        setActivities({ ...activities, questions: questionsUpdated });
    };

    const submit = (e) => {
        e.preventDefault();

        // Preparar a atividade
        const updatedActivity = {
            ...activities,
            userId: user ? user.id : null
        };

        // Verificar se é criação ou edição
        const method = activity ? 'PUT' : 'POST';
        const url = activity 
            ? `http://localhost:4000/activities/${activity.id}`
            : 'http://localhost:4000/activities';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedActivity),
        })
        .then((resp) => resp.json())
        .then((createdActivity) => {
            const activityId = createdActivity.id || activity.id;
            navigate(`/a/${activityId}`);
        })
        .catch((error) => {
            console.error('Erro ao criar/editar a atividade:', error);
        });
    };

    const deleteActivity = (activityId) => {
        if (window.confirm("Tem certeza que deseja excluir esta atividade?")) {
            fetch(`http://localhost:4000/activities/${activityId}`, {
                method: 'DELETE',
            })
            .then((resp) => {
                if (!resp.ok) {
                    throw new Error("Erro ao excluir a atividade.");
                }
                // Remover a atividade excluída da lista
                setActivities(activities.filter(activity => activity.id !== activityId));
                alert("Atividade excluída com sucesso!");
            })
            .catch((err) => console.error('Erro ao excluir atividade:', err));
        }
        activityId.preventDefault();
    };

    return (
        <div className={styles.container}>
            <form className={styles.form} onSubmit={submit}>
                <header className={styles.header}>
                    <h1><a href="/ua">Lovelace</a></h1>
                    <p>{activity ? "Editar Atividade" : "Criar Atividade"}</p>
                    <button type='submit'>{activity ? "Salvar" : "Criar"}</button>
                </header>
                {activity && (
                    <div className={styles.config}>
                        <button className={styles.linkButton}><a href={`/rA/${activity.id}`}>Respostas</a></button>
                        <button
                            className={styles.deleteButton}
                            onClick={() => deleteActivity(activity.id)}
                        >
                            Excluir
                        </button>
                    </div>
                )}
                <div className={styles.headerForm}>
                    <TextArea
                        name="name"
                        placeholder="Nome da sala"
                        value={activities.name}
                        handleOnChange={handleChange}
                        required="required"
                    />
                    <TextArea
                        name="description"
                        placeholder="Descrição"
                        value={activities.description}
                        handleOnChange={handleChange}
                        required="required"
                    />
                    {activity && activity.accessCode && (
                        <p>{activity.accessCode}</p>
                    )}
                </div>
                <button className={styles.plus} type="button" onClick={addQuestion}>
                    <FontAwesomeIcon className={styles.plus_svg} icon={faPlus} />
                </button>
                <div className={styles.container_question}>
                    {activities.questions.length > 0 && activities.questions.map((question) => (
                        <QuestionBox
                            key={question.id}
                            id={question.id}
                            proposal={question.proposal}
                            text={question.text}
                            handleQuestionChange={handleQuestionChange}
                            handleRemove={removeQuestion}
                        />
                    ))}
                </div>
            </form>
        </div>
    );
}

export default FormActivity;