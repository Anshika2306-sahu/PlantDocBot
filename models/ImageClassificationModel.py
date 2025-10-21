import torch
import torch.nn as nn

class ImageClassificationModel(nn.Module):
    """
    A simple CNN model for image classification
    This is a placeholder model structure - replace with your actual model
    """
    
    def __init__(self, num_classes=10):
        super(ImageClassificationModel, self).__init__()
        
        # Convolutional layers
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
        )
        
        # Classifier layers
        self.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(256 * 4 * 4, 512),  # Adjust based on input size
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes),
        )
    
    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)  # Flatten
        x = self.classifier(x)
        return x

# This would be used to load a trained model
def load_model(model_path, num_classes=10):
    """
    Load a trained model from disk
    
    Args:
        model_path (str): Path to the model file
        num_classes (int): Number of classes for the model
        
    Returns:
        ImageClassificationModel: Loaded model
    """
    model = ImageClassificationModel(num_classes)
    model.load_state_dict(torch.load(model_path))
    model.eval()
    return model