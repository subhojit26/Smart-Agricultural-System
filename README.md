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