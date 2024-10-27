import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ActivitySection.module.css';
import Dictionary from './Dictionary';

import Swal from "sweetalert2";


const ActivitySection = () => {
    const [accessCode, setAccessCode] = useState(''); 
    const [inputVisible, setInputVisible] = useState(false); 
    const [error, setError] = useState(null); 
    const navigate = useNavigate(); 
    const [timer, setTimer] = useState(null); 

    useEffect(() => {
        return () => clearTimeout(timer);
    }, [timer]);

    const handleAccessActivity = (e) => {
        e.preventDefault();

        if (!inputVisible) {
            setInputVisible(true);
            setError(null); 
            const newTimer = setTimeout(() => {
                setInputVisible(false);
                setAccessCode('');
            }, 7000);
            setTimer(newTimer);
        } else if (accessCode.trim()) {
            fetch(`http://localhost:4000/activities?accessCode=${accessCode}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.length > 0) {
                        const activity = data[0];
                        navigate(`/aA/${activity.id}`);
                    } else {
                        setError('Atividade não encontrada');
                    }
                })
                .catch((err) => {
                    console.error(err);
                    setError('Erro ao acessar a atividade.'); 
                });
        } else {
            setError('Por favor, insira um código de acesso.');
        }
    };

    const handleInputChange = (e) => {
        setAccessCode(e.target.value);
        if (timer) {
            clearTimeout(timer); 
            setTimer(null);
        }
    };

    useEffect(() => {
        if (inputVisible && accessCode.trim() === '') {
            const newTimer = setTimeout(() => {
                setInputVisible(false);
                setAccessCode(''); 
            }, 7000);
            setTimer(newTimer);

            return () => clearTimeout(newTimer);
        }
    }, [inputVisible, accessCode]);

    function pratica(){
        Swal.fire({
            title: 'Iniciar Atividades?',
            text: "Uma atividade que o tempo influencia em sua pontuação.",
            icon: 'warning',
            iconColor: '#F21B3F',
            background: 'white',
            showCancelButton: false,
            confirmButtonColor: '#F21B3F',
            border: 'none',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Iniciar',
          }).then((result) => {
            if (result.isConfirmed) {
              navigate('/prt');
            }
          })
      }


    return (
        <section className={styles.activitySection}>
                <section className={styles.predefinedActivities}>
                    <h2>Prática</h2>
                    <p>Experimente atividades pré-estabelecidas, desenvolvidas para aprimorar suas habilidades e reforçar conceitos essenciais, oferecendo uma prática estruturada e enriquecedora para seu aprendizado.</p>
                    <button onClick={pratica}><a>Go ahead</a></button>
                </section>
                <section className={styles.customActivity}>
                    <h2>Atividade Personalizada</h2>
                    <p>Crie suas próprias atividades personalizadas, adaptadas aos seus objetivos e interesses. Personalize os desafios para tornar o aprendizado mais eficaz e envolvente.</p>
                    <button>
                        <a href="/ce">Criar</a>
                    </button>
                </section>
                <section className={styles.accessActivity}>
                    <h2>Acessar Atividade</h2>
                    <p>Tem um código de acesso? Insira-o aqui para desbloquear uma atividade exclusiva, criada especialmente para você. Explore novos desafios e conteúdos personalizados.</p>
                    <form onSubmit={handleAccessActivity}>
                        {inputVisible && (
                            <input
                                type="text"
                                placeholder="Código de Acesso"
                                value={accessCode}
                                onChange={handleInputChange}
                                required
                            />
                        )}
                        <button type="submit">
                            {inputVisible ? 'Acessar' : 'Código'}
                        </button>
                    </form>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                </section>
                <Dictionary/>
        </section>
    );
};

export default ActivitySection;