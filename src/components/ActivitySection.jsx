import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ActivitySection.module.css';
import Dictionary from './Dictionary';

import generateActivityPDF from "../../services/generateActivityPDF.js";
import jsPDFInvoiceTemplate, { OutputType } from 'jspdf-invoice-template';

import Swal from "sweetalert2";

import db from "../../db.json";


const ActivitySection = () => {
    const [accessCode, setAccessCode] = useState(''); 
    const [inputVisible, setInputVisible] = useState(false); 
    const [error, setError] = useState(null); 
    const navigate = useNavigate(); 
    const [timer, setTimer] = useState(null); 
    const [activityId, setActivityId] = useState(''); // Definindo o estado para activityId

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
   
    function generateActivityPDF(activityId, userId) {
        // Encontrar a atividade pelo activityId
        const activity = db.activities.find(act => act.id === activityId);
        if (!activity) {
            console.error('Atividade não encontrada com o ID fornecido.');
            return;
        }
    
        // Encontrar todas as respostas para a atividade
        const responses = db.responses.filter(resp => resp.activityId === activity.id);
        if (responses.length === 0) {
            console.error('Respostas não encontradas para a atividade fornecida.');
            return;
        }
    
        // Encontrar o usuário que respondeu
        const respondingUser = db.users.find(usr => usr.id === userId);
        if (!respondingUser) {
            console.error('Usuário não encontrado com o ID fornecido.');
            return;
        }
    
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString();
        const formattedTime = currentDate.toLocaleTimeString();
    
        // Gerar PDF com as respostas
        const props = {
            outputType: OutputType.DataUriString,
            returnJsPDFDocObject: true,
            fileName: "Activity Response",
            orientationLandscape: false,
            logo: {
                src: "https://raw.githubusercontent.com/Danielalves33147/Imagens/main/TOKEN(4).png",
                type: 'PNG',
                width: 53.33,
                height: 26.66
            },
            business: {
                name: "A tool for English learning",
                address: "Camaçari / Bahia / Brasil",
                phone: "Plataforma desenvolvida em 2023",
                email: "suporte@lovelace.com",
            },
            contact: {
                label: `Responsavel: ${respondingUser.name}`,
                // name: respondingUser.name,
                // phone: respondingUser.email,
            },
            invoice: {
                label: "Código da Atividade: ",
                num: activityId,
                invDate: `Data de Impressão: ${formattedDate}`,
                invGenDate: `Horário: ${formattedTime}`,
                header: [
                    { title: "Aluno(a)", style: { width: 50 } },
                    { title: "Respostas", style: { width: 100 } },
                    { title: "Data", style: { width: 25 } },
                    { title: "Hora", style: { width: 25 } }
                ],
                table: responses.map((response) => [
                    response.user,
                    response.answers.map(answer => answer.text).join(", "),
                    new Date(response.date).toLocaleDateString(),
                    new Date(response.date).toLocaleTimeString()
                ]),
                tableStyles: {
                    cellPadding: 10,
                    padding: { top: 10, bottom: 10 },
                },
            },
            footer: {
                text: "Lovelace Copyright 2024.",
            },
            pageEnable: true,
        };
    
        const pdfObject = jsPDFInvoiceTemplate(props);
        const pdfDataUri = pdfObject.dataUriString;
    
        // Criar uma nova janela para exibir o PDF
        const newWindow = window.open();
        newWindow.document.open();
        newWindow.document.write(`
            <iframe width='100%' height='100%' src='${pdfDataUri}'></iframe>
        `);
        newWindow.document.close();
    
        // Adicionar uma página em branco ao PDF
        const pdfDoc = pdfObject.doc; // Obter o objeto PDF
        pdfDoc.addPage(); // Adiciona uma nova página em branco
    
        // Atualiza a nova janela para incluir a versão com a página em branco
        const updatedPdfDataUri = pdfDoc.output('datauristring');
        
        // Abrir nova janela para mostrar o PDF atualizado
        newWindow.document.open();
        newWindow.document.write(`
            <iframe width='100%' height='100%' src='${updatedPdfDataUri}'></iframe>
        `);
        newWindow.document.close();
    
        console.log("PDF criado com sucesso!", pdfObject);
    }
    

    function handleCreatePDF(activityId) {
        if (!activityId) {
            alert("Por favor, insira o ID da atividade.");
            return;
        }
    
        const userId = "08b6";  // ID local do usuário, substitua conforme necessário
        generateActivityPDF(activityId, userId);
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



                        <section className={styles.customActivity}>
                    <h2>Documentos das Atividades</h2>
                    <p> Gere um documento PDF com os estudantes que responderam sua atividade.</p>
                    <input
                        type="text"
                        placeholder="Insira o ID da atividade"
                        onChange={(e) => setActivityId(e.target.value)}
                    />
                    <button onClick={() => handleCreatePDF(activityId)}>Criar</button>
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