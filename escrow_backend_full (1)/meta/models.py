from django.db import models

class KnowledgeTag(models.Model):
    name = models.CharField(max_length=255)
    xml_content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
