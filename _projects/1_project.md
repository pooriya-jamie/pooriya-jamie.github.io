---
layout: page
title: ProtoPNet Project
description: a project with a background image
img: assets/img/12.jpg
importance: 1
category: work
related_publications: true
---

<!DOCTYPE html>
<html>
<head>
  <title>ProtoPNet for Medical Image Classification</title>
</head>
<body>
  <h1>ProtoPNet for Medical Image Classification</h1>

  <p>
    This repository contains code adapted from the ProtoPNet project (<a href="https://github.com/cfchen-duke/ProtoPNet">https://github.com/cfchen-duke/ProtoPNet</a>) for the classification of medical images. The primary dataset used for this adaptation is the MedMNIST dataset (<a href="https://medmnist.com/">https://medmnist.com/</a>), specifically focusing on the PneumoniaMNIST subset.
  </p>

  <h2>Overview</h2>

  <p>
    ProtoPNet is a neural network architecture designed for few-shot image classification tasks, which are often encountered in medical imaging scenarios where labeled data is scarce. By adapting ProtoPNet to medical datasets, particularly focusing on pneumonia classification using chest X-ray images, I aim to demonstrate its efficacy in a domain where labeled data is typically limited.
  </p>

  <h2>Dataset</h2>

  <p>
    The primary dataset used in this project is the PneumoniaMNIST subset of MedMNIST, which consists of binary-class chest X-ray images labeled as either pneumonia-positive or pneumonia-negative. The dataset comprises the following splits:
  </p>

  <ul>
    <li><strong>Training Set:</strong> 4,708 samples</li>
    <li><strong>Validation Set:</strong> 524 samples</li>
    <li><strong>Test Set:</strong> 624 samples</li>
  </ul>

  <p>
    For citing the dataset, please refer to the following papers:
  </p>

  <ul>
    <li>Jiancheng Yang, Rui Shi, Donglai Wei, Zequan Liu, Lin Zhao, Bilian Ke, Hanspeter Pfister, Bingbing Ni. "MedMNIST v2-A large-scale lightweight benchmark for 2D and 3D biomedical image classification." <em>Scientific Data</em>, 2023.</li>
    <li>Jiancheng Yang, Rui Shi, Bingbing Ni. "MedMNIST Classification Decathlon: A Lightweight AutoML Benchmark for Medical Image Analysis". <em>IEEE 18th International Symposium on Biomedical Imaging (ISBI)</em>, 2021.</li>
  </ul>

  <p>
    Additionally, supplementary data might have been collected from external sources, which should be properly cited as per their respective licenses and guidelines.
  </p>

  <h2>Usage</h2>

  <ol>
    <li><strong>Data Preparation:</strong> Download the PneumoniaMNIST dataset from the MedMNIST website or other authorized sources. Preprocess the data as necessary for training, validation, and testing.</li>
    <li><strong>Model Training:</strong> Train the ProtoPNet model using the provided code. Adjust hyperparameters and network architecture as needed based on the specific requirements of the medical image classification task.</li>
    <li><strong>Evaluation:</strong> Evaluate the trained model on the validation and test sets to assess its performance. Utilize appropriate metrics such as accuracy, precision, recall, and F1-score to measure classification performance.</li>
    <li><strong>Deployment:</strong> Once satisfied with the model's performance, deploy it in relevant medical applications for pneumonia classification tasks. Ensure compliance with regulatory standards and ethical guidelines governing medical AI applications.</li>
  </ol>

  <h2>Acknowledgments</h2>

  <p>
    I acknowledge the developers of ProtoPNet for providing the foundational codebase for this project. Additionally, I express our gratitude to the authors of the MedMNIST dataset for curating and releasing a valuable resource for the medical imaging community.
  </p>
</body>
</html>

{% endraw %}
