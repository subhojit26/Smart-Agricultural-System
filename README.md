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