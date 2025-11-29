import graphene
from graphene_django import DjangoObjectType
from indexer.models import Project, Milestone, Pledge

class ProjectType(DjangoObjectType):
    class Meta:
        model = Project
        fields = ('project_id', 'title', 'escrow_address', 'funding_goal', 'deadline', 'status')

class MilestoneType(DjangoObjectType):
    class Meta:
        model = Milestone
        fields = '__all__'

class PledgeType(DjangoObjectType):
    class Meta:
        model = Pledge
        fields = '__all__'

class Query(graphene.ObjectType):
    project = graphene.Field(ProjectType, id=graphene.String(required=True))
    projects = graphene.List(ProjectType)
    milestones = graphene.List(MilestoneType, project_id=graphene.String(required=True))

    def resolve_project(root, info, id):
        return Project.objects.using('indexer').get(project_id=id)

    def resolve_projects(root, info):
        return Project.objects.using('indexer').all()[:100]

    def resolve_milestones(root, info, project_id):
        return Milestone.objects.using('indexer').filter(project__project_id=project_id)

schema = graphene.Schema(query=Query)
