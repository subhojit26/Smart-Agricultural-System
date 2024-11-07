
\section{Scheme and Subsidy Awareness Module}

\subsection{Introduction}

Indian farmers are often unaware of the various schemes and subsidies available to them. This module aims to bridge this information gap by providing a comprehensive guide to government schemes and subsidies for farmers in Karnataka. By leveraging data from official sources, we offer detailed insights into eligibility criteria, application procedures, and benefits of each scheme, empowering farmers to make informed decisions and access the support they need.

\subsection{Literature Review}

Based on the literature review, we identified several key schemes and subsidies that are relevant to farmers in Karnataka. These include the Pradhan Mantri Fasal Bima Yojana (PMFBY), the Soil Health Card Scheme, and the Rashtriya Krishi Vikas Yojana (RKVY). Each of these schemes offers unique benefits and support to farmers, ranging from crop insurance to soil health monitoring and financial assistance for agricultural projects.



\subsection{Dataset Collection}

To build this module, we collected data from various official sources, including the Ministry of Agriculture and Farmers Welfare, the Department of Agriculture, Cooperation, and Farmers Welfare, and the Karnataka State Government. By aggregating information from these sources, we created a comprehensive database of schemes and subsidies available to farmers in Karnataka, complete with details on eligibility criteria, application procedures, and benefits.

\subsection{Data Preprocessing}

The collected data was in inconsistent formats and required extensive preprocessing to ensure accuracy and consistency. We cleaned the data by removing duplicates, standardizing column names, and filling missing values where possible. We also performed data validation checks to identify and correct errors, ensuring that the information presented to farmers is reliable and up-to-date.



{itemize}
\item Data Cleaning: Remove duplicates, standardize column names, fill missing values
\item Data Validation: Identify and correct errors, ensure reliability and accuracy
{itemize}


\subsection{Vectorization and Embedding}

Vectorisation is a process of converting text data into numerical data. This is done to make the data compatible with machine learning algorithms. In this module, we used the TF-IDF vectorization technique to convert the scheme descriptions into numerical data. This allows us to perform similarity analysis and recommend relevant schemes to farmers based on their preferences and requirements.

The data is first passed through a tokenizer which breaks down the text into individual words. These words are then converted into vectors using BERt embeddings. These vectors are then passed through a neural network to generate a final vector representation of the text. This vector is then used to calculate the similarity between different schemes and recommend the most relevant ones to the farmers.

This vectorised data then can be used to calculate the similarity between different schemes and recommend the most relevant ones to the farmers.



\section{Multi-lingual AI Chatbot}

\subsection{Introduction}

The Multi-lingual AI Chatbot is designed to provide farmers with real-time assistance and support in multiple languages. By leveraging natural language processing (NLP) and machine learning algorithms, the chatbot can understand and respond to queries in English, Hindi, Kannada, and other regional languages. This enables farmers to access information on agricultural practices, weather forecasts, market prices, and government schemes in their preferred language, making it easier for them to communicate and engage with the chatbot.

\subsection{Literature Review}

Based on the literature review, we identified that language barriers are a significant challenge for farmers in India, especially those in rural areas. Many farmers are more comfortable speaking in their regional language than in English or Hindi, which can hinder their ability to access information and support services. 

The support system for farmers in India is limited, and there is a need for innovative solutions to bridge this gap. Getting hold of information on agricultural practices, weather forecasts, market prices, and government schemes can be challenging for farmers, especially those in remote areas. By providing a multi-lingual chatbot, we aim to address this issue and empower farmers to access the information they need in their preferred language.


\subsection{Architecture}

The Multi-lingual AI Chatbot is built on a modular architecture with the help of OpenAI's Realtime API. The chatbot consists of three main components: the client-side application, the relay server, and the Realtime API. The client-side application is built using React and Webpack, providing a responsive user interface for farmers to interact with the chatbot. The relay server is an optional component that can be used to enhance security and implement custom server-side logic. The Realtime API is the core component that processes user queries and generates responses in real-time.

\subsection*{Key Components}

\begin{itemize}
    \item \textbf{Client-Side Application}:
        \begin{itemize}
            \item Built with **React** and bundled using **Webpack**, providing a modular and responsive user interface.
            \item Includes a **Realtime API Reference Client** that manages the direct interaction with the Smart AI Realtime API. The client supports audio input streaming, conversation management, and tool-based function invocation.
            \item **WavTools Library**: A custom library in \texttt{/src/lib/wavtools} manages audio recording and playback, making it easy to handle audio streams for real-time responses.
        \end{itemize}
    \item \textbf{Relay Server (Optional)}:
        \begin{itemize}
            \item A **Node.js-based relay server** (optional) can be used to enhance security by masking API keys and implementing custom server-side logic, such as filtering events or controlling access to certain tools.
            \item This server is configured with a \texttt{.env} file to specify the API key and the server URL, making it simple to switch between using the relay server and directly connecting to the Smart AI API.
        \end{itemize}
\end{itemize}

\subsection*{Key Functionalities}

\begin{itemize}
    \item \textbf{Interactive Audio and Text-Based Console}:
        \begin{itemize}
            \item Users can initiate conversations by connecting to the Realtime API and choose between **Push-to-Talk** (manual) or **Voice Activity Detection (VAD)** modes. The VAD mode detects when users start and stop speaking, automating the flow of audio input and model responses.
            \item The console enables interrupting ongoing responses, a crucial feature for controlling conversation flow in real-time applications.
        \end{itemize}
    \item \textbf{Audio Management}:
        \begin{itemize}
            \item Using **WavRecorder** and **WavStreamPlayer** from the WavTools library, the console allows users to capture, manage, and visualize audio input streams.
            \item WavRecorder supports real-time audio input from the microphone, recording audio in chunks for transmission to the API, while WavStreamPlayer manages audio playback with control over audio buffering, frequency analysis, and playback interruption.
        \end{itemize}
    \item \textbf{Tool Integration and Management}:
        \begin{itemize}
            \item The console allows developers to add custom tools (e.g., \texttt{get\_weather} and \texttt{set\_memory}) by defining the tool's metadata and callback functions. These tools can be invoked by the model and can interact with external APIs or functions on behalf of the user.
            \item This modular approach allows for easy extension, letting developers add new tools with minimal code changes, enabling experimentation with various API interactions.
        \end{itemize}
    \item \textbf{Event-Driven Communication}:
        \begin{itemize}
            \item The Realtime API client is built on an event-driven model, where key events such as conversation updates, interruptions, and completion are managed through event listeners. This architecture simplifies tracking and responding to user and model actions dynamically.
        \end{itemize}
\end{itemize}



\begin{center}
	\justifying
	\chapter{RESULTS AND ANALYSIS}

 The results and analysis of the three modules are detailed in the subsections below:

    \section{Scheme and Subsidy Awareness Module} 

On preliminary testing, the Scheme and Subsidy Awareness Module performed well in providing detailed information on various government schemes and subsidies available to farmers in Karnataka. The module is sometimes slow in responding to user queries, which may be due to the large amount of data being processed. However, the accuracy and relevance of the information provided are notable.

    \section{Multi-lingual AI Chatbot}

The Multi-lingual AI Chatbot demonstrated impressive capabilities in understanding and responding to user queries in Hindi, Kannada and English. This is tested with general purpose queries and also with queries that require the chatbot to use the tools provided to it at the backend. 

Since it is an independent module for now, it's capabilities are limited to the tools provided to it. However, on integrating it with the rest of the modules, it can provide a comprehensive support system for farmers in multiple languages.
=======
